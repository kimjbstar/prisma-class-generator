import { DMMF } from '@prisma/generator-helper'
import { ClassComponent } from './components/class.component'
import { DecoratorComponent } from './components/decorator.component'
import { FieldComponent } from './components/field.component'
import { PrismaClassGeneratorConfig, REPO_URL } from './generator'
import {
	arrayify,
	capitalizeFirst,
	escapeSingleQuotedString,
	getFieldDescription,
	hasFieldDirective,
	uniquify,
	wrapArrowFunction,
	wrapQuote,
} from './util'

/**
 * `nativeType` was added to DMMF.Field in Prisma 6 and isn't declared on the pinned
 * `@prisma/generator-helper` 5.x types this repo builds against — but the field object a
 * Prisma 6/7 CLI actually hands to this generator at runtime does include it (verified via
 * `getDMMF` against real 6.19.3/7.9.1 installs, not guessed). It's `undefined` on Prisma 5
 * (the key is absent entirely), `null` when the field has no `@db.*` annotation, or
 * `[typeName, args]`, e.g. `@db.VarChar(191)` -> `['VarChar', ['191']]`.
 */
type FieldWithNativeType = DMMF.Field & {
	nativeType?: [string, string[]] | null
}

/** BigInt, Boolean, Bytes, DateTime, Decimal, Float, Int, JSON, String, $ModelName */
type DefaultPrismaFieldType =
	| 'BigInt'
	| 'Boolean'
	| 'Bytes'
	| 'DateTime'
	| 'Decimal'
	| 'Float'
	| 'Int'
	| 'Json'
	| 'String'

const primitiveMapType: Record<DefaultPrismaFieldType, string> = {
	Int: 'number',
	String: 'string',
	DateTime: 'Date',
	Boolean: 'boolean',
	Json: 'object',
	BigInt: 'BigInt',
	Float: 'number',
	Decimal: 'number',
	Bytes: 'Buffer',
} as const

export type PrimitiveMapTypeKeys = keyof typeof primitiveMapType
export type PrimitiveMapTypeValues =
	(typeof primitiveMapType)[PrimitiveMapTypeKeys]

// class-validator has no direct equivalent for BigInt/Bytes/Json, so those are left without
// a type-specific validator (they still get @IsOptional() when nullable).
const validationDecoratorMap: Partial<Record<DefaultPrismaFieldType, string>> =
	{
		Int: 'IsInt',
		Float: 'IsNumber',
		Decimal: 'IsNumber',
		String: 'IsString',
		Boolean: 'IsBoolean',
		// a plain string field, not `Date` -- validates the raw string a JSON body actually
		// contains without requiring class-transformer's @Type(() => Date) to run first.
		DateTime: 'IsDateString',
	}

// `@db.*` native types that fully replace the generic type-based validator above, because
// they describe a specific string *format* rather than just "a string". One validator name
// per format, shared across the connectors that use it (postgresql/cockroachdb's `Uuid` and
// sqlserver's `UniqueIdentifier` are both UUIDs; mongodb's `ObjectId` is its own format).
// Verified against real Prisma 6/7 DMMF output per connector, not guessed.
const nativeTypeReplacementValidatorMap: Record<string, string> = {
	Uuid: 'IsUUID',
	UniqueIdentifier: 'IsUUID',
	ObjectId: 'IsMongoId',
}

// `@db.VarChar(n)`/`@db.Char(n)` (and sqlserver's N-prefixed variants) carry a length
// constraint that class-validator can check directly -- added alongside the base @IsString().
const nativeTypesWithLengthConstraint = ['VarChar', 'NVarChar', 'Char', 'NChar']

// mysql's unsigned integer native types -- added alongside the base @IsInt().
const unsignedIntegerNativeTypes = [
	'UnsignedInt',
	'UnsignedTinyInt',
	'UnsignedSmallInt',
	'UnsignedMediumInt',
]

export interface SwaggerDecoratorParams {
	isArray?: boolean
	type?: string
	enum?: string
	enumName?: string
	description?: string
	example?: string
}

export interface ConvertModelInput {
	model: DMMF.Model
	extractRelationFields?: boolean
	postfix?: string
	useGraphQL?: boolean
}

export class PrismaConvertor {
	static instance: PrismaConvertor
	private _config: PrismaClassGeneratorConfig
	private _dmmf: DMMF.Document

	public get dmmf() {
		return this._dmmf
	}

	public set dmmf(value) {
		this._dmmf = value
	}

	public get config() {
		return this._config
	}

	public set config(value) {
		this._config = value
	}

	static getInstance() {
		if (PrismaConvertor.instance) {
			return PrismaConvertor.instance
		}
		PrismaConvertor.instance = new PrismaConvertor()
		return PrismaConvertor.instance
	}

	getPrimitiveMapTypeFromDMMF = (
		dmmfField: DMMF.Field,
	): PrimitiveMapTypeValues => {
		if (typeof dmmfField.type !== 'string') {
			return 'unknown'
		}
		return primitiveMapType[dmmfField.type]
	}

	extractTypeGraphQLDecoratorFromField = (
		dmmfField: DMMF.Field,
	): DecoratorComponent => {
		const options: SwaggerDecoratorParams = {}
		const decorator = new DecoratorComponent({
			name: 'Field',
			importFrom: '@nestjs/graphql',
		})
		if (dmmfField.isId) {
			decorator.params.push(`(type) => ID`)
			return decorator
		}
		const isJson = dmmfField.type === 'Json'

		if (isJson) {
			decorator.params.push(`(type) => GraphQLJSONObject`)
		}

		let type = this.getPrimitiveMapTypeFromDMMF(dmmfField)

		if (type && type !== 'any' && !isJson) {
			let grahQLType = capitalizeFirst(type)
			if (grahQLType === 'Number') {
				// Int, Float, and Decimal all map to the TS type 'number', but GraphQL
				// distinguishes Int from Float — Int must be a 32-bit integer, so a Float or
				// Decimal field mapped to GraphQL Int would fail GraphQL's own runtime
				// validation for any fractional value.
				grahQLType =
					dmmfField.type === 'Float' || dmmfField.type === 'Decimal'
						? 'Float'
						: 'Int'
			}
			if (dmmfField.isList) {
				grahQLType = `[${grahQLType}]`
			}
			decorator.params.push(`(type) => ${grahQLType}`)
		}

		// relation fields and MongoDB composite `type` fields both reference another
		// generated class, so both need an explicit `(type) => X` — GraphQL can't infer
		// this from reflection metadata alone.
		if (dmmfField.relationName || dmmfField.kind === 'object') {
			let type = dmmfField.type
			if (dmmfField.isList) {
				type = `[${type}]`
			}
			decorator.params.push(`(type) => ${type}`)
		}

		if (dmmfField.kind === 'enum') {
			let type = dmmfField.type
			if (dmmfField.isList) {
				type = arrayify(type)
			}
			decorator.params.push(`(type) => ${type}`)
		}

		if (dmmfField.isRequired === false) {
			decorator.params.push(`{nullable : true}`)
		}

		return decorator
	}

	extractSwaggerDecoratorFromField = (
		dmmfField: DMMF.Field,
	): DecoratorComponent => {
		const options: SwaggerDecoratorParams = {}
		const name =
			dmmfField.isRequired === true
				? 'ApiProperty'
				: 'ApiPropertyOptional'
		const decorator = new DecoratorComponent({
			name: name,
			importFrom: '@nestjs/swagger',
		})

		if (dmmfField.isList) {
			options.isArray = true
		}

		let type = this.getPrimitiveMapTypeFromDMMF(dmmfField)
		if (type && type !== 'any') {
			options.type = capitalizeFirst(type)
		} else {
			type = dmmfField.type.toString()

			// relation fields and MongoDB composite `type` fields both reference another
			// generated class, so both need an explicit type — Swagger can't reliably infer
			// this from TS reflection metadata, especially for arrays.
			if (dmmfField.relationName || dmmfField.kind === 'object') {
				options.type = wrapArrowFunction(dmmfField)
			} else if (dmmfField.kind === 'enum') {
				options.enum = dmmfField.type
				options.enumName = wrapQuote(dmmfField)
			}
		}

		// both are derived straight from the schema (the doc comment text, the @default(...)
		// value) rather than guessed, so they're safe to include unconditionally whenever
		// useSwagger is on -- no separate opt-in option.
		const description = getFieldDescription(dmmfField.documentation)
		if (description) {
			options.description = `'${escapeSingleQuotedString(description)}'`
		}
		const example = this.getExampleValueFromDefault(dmmfField)
		if (example !== undefined) {
			options.example = example
		}

		decorator.params.push(options)
		return decorator
	}

	/**
	 * Builds a swagger `example` value from a field's literal `@default(...)`, formatted as
	 * a ready-to-interpolate JS literal (matching how `field.default` is formatted in
	 * convertField). Deliberately conservative: function-based defaults (`now()`,
	 * `autoincrement()`, `dbgenerated()`) and array defaults are skipped entirely (there's no
	 * single literal to show), and so are BigInt/DateTime, where `BigInt(...)`/`new Date(...)`
	 * inside an `example` would be more noise than signal.
	 */
	getExampleValueFromDefault = (
		dmmfField: DMMF.Field,
	): string | undefined => {
		if (dmmfField.default === undefined || dmmfField.default === null) {
			return undefined
		}
		if (typeof dmmfField.default !== 'object') {
			if (dmmfField.kind === 'enum') {
				return `${dmmfField.type}.${dmmfField.default}`
			}
			if (dmmfField.type === 'BigInt' || dmmfField.type === 'DateTime') {
				return undefined
			}
			if (dmmfField.type === 'String') {
				return `'${escapeSingleQuotedString(
					dmmfField.default.toString(),
				)}'`
			}
			return dmmfField.default.toString()
		}
		return undefined
	}

	/**
	 * Returns zero or more class-validator decorators for a field. Unlike the swagger/graphql
	 * extractors this can return several decorators for one field (e.g. `@IsOptional()` +
	 * `@IsString()`), so it returns an array instead of a single DecoratorComponent.
	 *
	 * Relation and composite-type fields are left without a type-specific validator by
	 * default: this generator hands DTO composition to the caller rather than deciding what a
	 * create/update payload should look like (see the README FAQ) — validating a nested object
	 * would require assuming that shape. The `validateNestedRelations` option opts back in to
	 * `@ValidateNested()` + `@Type(() => X)` for callers who *do* want NestJS's `ValidationPipe`
	 * (with `transform: true`) to recurse into relation/composite payloads as-is.
	 */
	extractValidationDecoratorsFromField = (
		dmmfField: DMMF.Field,
	): DecoratorComponent[] => {
		const decorators: DecoratorComponent[] = []
		const importFrom = 'class-validator'
		const eachOption = dmmfField.isList ? { each: true } : undefined

		if (dmmfField.isRequired === false) {
			decorators.push(
				new DecoratorComponent({ name: 'IsOptional', importFrom }),
			)
		}

		if (dmmfField.isList) {
			decorators.push(
				new DecoratorComponent({ name: 'IsArray', importFrom }),
			)
		}

		if (dmmfField.relationName || dmmfField.kind === 'object') {
			if (this.config.validateNestedRelations) {
				decorators.push(
					new DecoratorComponent({
						name: 'ValidateNested',
						importFrom: 'class-validator',
						params: eachOption ? [eachOption] : [],
					}),
				)
				// class-transformer's @Type is what makes @ValidateNested actually recurse:
				// without it, a plain JSON payload's nested object is never turned into an
				// instance of the related class, so class-validator has nothing to validate.
				decorators.push(
					new DecoratorComponent({
						name: 'Type',
						importFrom: 'class-transformer',
						params: [wrapArrowFunction(dmmfField)],
					}),
				)
			}
			return decorators
		}

		if (dmmfField.kind === 'enum') {
			const params = eachOption
				? [dmmfField.type, eachOption]
				: [dmmfField.type]
			decorators.push(
				new DecoratorComponent({ name: 'IsEnum', importFrom, params }),
			)
			return decorators
		}

		if (typeof dmmfField.type === 'string') {
			const [nativeTypeName, nativeTypeArgs] =
				(dmmfField as FieldWithNativeType).nativeType ?? []

			// a native type that describes a specific string format (Uuid, ObjectId, ...)
			// replaces the generic type-based validator instead of stacking alongside it.
			const validatorName =
				(nativeTypeName &&
					nativeTypeReplacementValidatorMap[nativeTypeName]) ||
				validationDecoratorMap[dmmfField.type as DefaultPrismaFieldType]
			if (validatorName) {
				decorators.push(
					new DecoratorComponent({
						name: validatorName,
						importFrom,
						params: eachOption ? [eachOption] : [],
					}),
				)
			}

			if (
				nativeTypeName &&
				nativeTypesWithLengthConstraint.includes(nativeTypeName) &&
				nativeTypeArgs?.[0]
			) {
				const maxLength = Number(nativeTypeArgs[0])
				decorators.push(
					new DecoratorComponent({
						name: 'MaxLength',
						importFrom,
						params: eachOption
							? [maxLength, eachOption]
							: [maxLength],
					}),
				)
			}

			if (
				nativeTypeName &&
				unsignedIntegerNativeTypes.includes(nativeTypeName)
			) {
				decorators.push(
					new DecoratorComponent({
						name: 'Min',
						importFrom,
						params: eachOption ? [0, eachOption] : [0],
					}),
				)
			}
		}

		return decorators
	}

	getClass = (input: ConvertModelInput): ClassComponent => {
		/** options */
		const options = Object.assign(
			{
				extractRelationFields: null,
				useGraphQL: false,
			},
			input,
		)
		const {
			model,
			extractRelationFields = null,
			postfix,
			useGraphQL,
		} = options

		/** set class name */
		let className = model.name
		if (postfix) {
			className += postfix
		}
		const classComponent = new ClassComponent({ name: className })

		// `/// @skip` on a field excludes it from the generated class entirely (and from
		// relation/enum/composite-type imports below) — useful for auto-populated columns
		// like id/createdAt/updatedAt that shouldn't appear on a create/update DTO.
		const visibleFields = model.fields.filter(
			(field) => !hasFieldDirective(field.documentation, 'skip'),
		)

		/** relation & enums */
		const relationTypes = uniquify(
			visibleFields
				.filter(
					(field) =>
						field.relationName &&
						(this._config.separateRelationFields
							? true
							: model.name !== field.type),
				)
				.map((v) => v.type),
		)

		const typesTypes = uniquify(
			visibleFields
				.filter(
					(field) =>
						field.kind == 'object' &&
						model.name !== field.type &&
						!field.relationName,
				)
				.map((v) => v.type),
		)

		const enums = visibleFields.filter((field) => field.kind === 'enum')

		classComponent.fields = visibleFields
			.filter((field) => {
				if (extractRelationFields === true) {
					return field.relationName
				}
				if (extractRelationFields === false) {
					return !field.relationName
				}
				return true
			})
			.map((field) => this.convertField(field))
		classComponent.relationTypes =
			extractRelationFields === false ? [] : relationTypes

		classComponent.enumTypes =
			extractRelationFields === true
				? []
				: enums.map((field) => field.type.toString())

		classComponent.types = typesTypes

		if (useGraphQL) {
			const deco = new DecoratorComponent({
				name: 'ObjectType',
				importFrom: '@nestjs/graphql',
			})
			deco.params.push(
				JSON.stringify({
					description: `generated by [prisma-class-generator](${REPO_URL})`,
				}),
			)
			classComponent.decorators.push(deco)

			if (classComponent.enumTypes.length > 0) {
				const extra = classComponent.enumTypes
					.map(
						(enumType) => `registerEnumType(${enumType}, {
	name: "${enumType}"
})`,
					)
					.join('\r\n\r\n')

				classComponent.extra = extra
			}
		}

		return classComponent
	}

	/**
	 * one prisma model could generate multiple classes!
	 *
	 * CASE 1: if you want separate model to normal class and relation class
	 */
	getClasses = (): ClassComponent[] => {
		const models = this.dmmf.datamodel.models

		/** separateRelationFields */
		if (this.config.separateRelationFields === true) {
			return [
				...models.map((model) =>
					this.getClass({
						model,
						extractRelationFields: true,
						postfix: 'Relations',
						useGraphQL: this.config.useGraphQL,
					}),
				),
				...models.map((model) =>
					this.getClass({
						model,
						extractRelationFields: false,
						useGraphQL: this.config.useGraphQL,
					}),
				),
				// mongodb Types support
				...this.dmmf.datamodel.types.map((model) =>
					this.getClass({
						model,
						extractRelationFields: true,
						useGraphQL: this.config.useGraphQL,
					}),
				),
			]
		}

		return [
			...models.map((model) =>
				this.getClass({ model, useGraphQL: this.config.useGraphQL }),
			),
			// mongodb Types support
			...this.dmmf.datamodel.types.map((model) =>
				this.getClass({
					model,
					useGraphQL: this.config.useGraphQL,
				}),
			),
		]
	}

	convertField = (dmmfField: DMMF.Field): FieldComponent => {
		const field = new FieldComponent({
			name: dmmfField.name,
			useUndefinedDefault: this._config.useUndefinedDefault,
		})
		let type = this.getPrimitiveMapTypeFromDMMF(dmmfField)

		if (this.config.useSwagger) {
			const decorator = this.extractSwaggerDecoratorFromField(dmmfField)
			field.decorators.push(decorator)

			// `/// @ApiHideProperty` keeps the field on the class but hides it from the
			// generated Swagger/OpenAPI docs — for fields like passwordHash that a DTO still
			// needs at the type level but should never be documented.
			if (hasFieldDirective(dmmfField.documentation, 'ApiHideProperty')) {
				field.decorators.push(
					new DecoratorComponent({
						name: 'ApiHideProperty',
						importFrom: '@nestjs/swagger',
					}),
				)
			}
		}

		if (this.config.useGraphQL) {
			const decorator =
				this.extractTypeGraphQLDecoratorFromField(dmmfField)
			if (decorator) {
				field.decorators.push(decorator)
			}
		}

		if (this.config.useValidation) {
			field.decorators.push(
				...this.extractValidationDecoratorsFromField(dmmfField),
			)
		}

		// `/// @exclude` keeps the field on the class but adds class-transformer's @Exclude(),
		// so a ClassSerializerInterceptor strips it from responses -- for fields like
		// passwordHash that the class needs at the type level but should never be serialized.
		if (
			this.config.useSerialization &&
			hasFieldDirective(dmmfField.documentation, 'exclude')
		) {
			field.decorators.push(
				new DecoratorComponent({
					name: 'Exclude',
					importFrom: 'class-transformer',
				}),
			)
		}

		if (dmmfField.isRequired === false) {
			field.nullable = true
		}

		if (this.config.useNonNullableAssertions) {
			field.nonNullableAssertion = true
		}

		if (this.config.preserveDefaultNullable) {
			field.preserveDefaultNullable = true
		}

		if (dmmfField.default !== undefined && dmmfField.default !== null) {
			if (typeof dmmfField.default !== 'object') {
				field.default = dmmfField.default.toString()
				if (dmmfField.kind === 'enum') {
					field.default = `${dmmfField.type}.${dmmfField.default}`
				} else if (dmmfField.type === 'BigInt') {
					field.default = `BigInt(${field.default})`
				} else if (dmmfField.type === 'String') {
					field.default = `'${field.default}'`
				} else if (dmmfField.type === 'DateTime') {
					field.default = `new Date('${field.default}')`
				}
			} else if (Array.isArray(dmmfField.default)) {
				if (dmmfField.type === 'String') {
					field.default = `[${dmmfField.default
						.map((d) => `'${d}'`)
						.toString()}]`
				} else {
					field.default = `[${dmmfField.default.toString()}]`
				}
			}
		}

		if (type) {
			field.type = type
		} else if (dmmfField.relationName) {
			// use the `type`-only import alias FileComponent registers for relation fields
			// (see resolveImports) to avoid an ESM circular-import crash — see #60.
			field.type = `${dmmfField.type}AsType`
		} else {
			field.type = dmmfField.type
		}

		// preserveDecimal only swaps the field's own TS type to Prisma.Decimal (for
		// type-safety against Prisma Client's own return types) — it intentionally leaves
		// the swagger/graphql decorator options alone (still Number/Float), since Decimal
		// has no OpenAPI/GraphQL representation of its own and documenting it as a plain
		// number is still the right call there.
		if (dmmfField.type === 'Decimal' && this.config.preserveDecimal) {
			field.type = 'Prisma.Decimal'
		}

		if (dmmfField.isList) {
			field.type = arrayify(field.type)
		}

		return field
	}
}
