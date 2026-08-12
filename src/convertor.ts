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
// sqlserver's `UniqueIdentifier` are both UUIDs; mongodb's `ObjectId` is its own format;
// postgresql/cockroachdb's `Inet` is an IP address, per Prisma's own schema reference docs).
// Verified against real Prisma 6/7 DMMF output per connector, not guessed.
const nativeTypeReplacementValidatorMap: Record<string, string> = {
	Uuid: 'IsUUID',
	UniqueIdentifier: 'IsUUID',
	ObjectId: 'IsMongoId',
	Inet: 'IsIP',
}

// `@db.VarChar(n)`/`@db.Char(n)` (and sqlserver's N-prefixed variants) carry a length
// constraint that class-validator can check directly -- added alongside the base @IsString().
// `String` is CockroachDB's own name for the same thing: unlike postgresql's `@db.VarChar(x)`,
// CockroachDB maps `STRING(x)`/`TEXT(x)`/`VARCHAR(x)` all to a single `@db.String(x)` attribute
// (per Prisma's schema reference docs) -- without this, CockroachDB length-constrained string
// fields silently got no @MaxLength() at all.
const nativeTypesWithLengthConstraint = [
	'VarChar',
	'NVarChar',
	'Char',
	'NChar',
	'String',
]

// mysql's unsigned integer native types -- added alongside the base @IsInt().
//
// Deliberately excludes `UnsignedBigInt`: it maps to Prisma's `BigInt` scalar (see
// primitiveMapType above), and class-validator's own `Min`/`Max` (typestack/class-validator's
// src/decorator/number/Min.ts) require `typeof num === 'number'` -- a JS `BigInt` value's
// `typeof` is always `'bigint'`, never `'number'`, so `@Min(0)` would reject every value,
// including valid non-negative ones. Don't add it until class-validator itself supports bigint
// comparison.
const unsignedIntegerNativeTypes = [
	'UnsignedInt',
	'UnsignedTinyInt',
	'UnsignedSmallInt',
	'UnsignedMediumInt',
]

/**
 * True when a field references another generated class -- either a relation field or a
 * MongoDB composite `type` field (kind === 'object') -- rather than holding a primitive value
 * or enum directly. The swagger/graphql/validation extractors and convertField all need this
 * same check to decide whether the field needs an explicit `type: () => X` reference.
 */
const isRelationOrComposite = (dmmfField: DMMF.Field): boolean => {
	return !!dmmfField.relationName || dmmfField.kind === 'object'
}

/**
 * Formats an enum field's literal default as `EnumName.MemberName` -- identical whether it's
 * being used as a swagger `example` (getExampleValueFromDefault) or as the field's actual
 * `= value` initializer (convertField). Everything else about those two default-formatting
 * chains genuinely differs (see convertField's inline comments on BigInt/DateTime handling),
 * so only this one sub-piece is shared.
 */
const formatEnumDefault = (dmmfField: DMMF.Field): string => {
	return `${dmmfField.type}.${dmmfField.default}`
}

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
	// injected through the setters below immediately after getInstance()/new (see
	// PrismaClassGenerator#buildFileComponents) rather than passed to the constructor, so
	// there is nothing sensible to initialize them to here. Defaulting `_config` to `{}`
	// would be worse than leaving it unset: a forgotten `convertor.config = ...` would then
	// silently generate output with every option off instead of failing loudly.
	private _config!: PrismaClassGeneratorConfig
	private _dmmf!: DMMF.Document

	public get dmmf(): DMMF.Document {
		return this._dmmf
	}

	public set dmmf(value: DMMF.Document) {
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

	// `undefined` for every field that isn't a Prisma scalar (relations, enums, composite
	// types) -- callers branch on that to decide whether the field needs an explicit
	// `type: () => X` reference instead of a primitive TS type.
	getPrimitiveMapTypeFromDMMF = (
		dmmfField: DMMF.Field,
	): PrimitiveMapTypeValues | undefined => {
		if (typeof dmmfField.type !== 'string') {
			return 'unknown'
		}
		return primitiveMapType[dmmfField.type as DefaultPrismaFieldType]
	}

	extractTypeGraphQLDecoratorFromField = (
		dmmfField: DMMF.Field,
	): DecoratorComponent => {
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

		// GraphQL's decorator factory takes a bracketed array literal (`[Type]`), not TS's
		// `Type[]` suffix -- wrapping consistently here keeps the branches below in sync.
		const wrapIfList = (fieldType: string): string =>
			dmmfField.isList ? `[${fieldType}]` : fieldType

		const type = this.getPrimitiveMapTypeFromDMMF(dmmfField)

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
			decorator.params.push(`(type) => ${wrapIfList(grahQLType)}`)
		}

		// relation fields and MongoDB composite `type` fields both reference another
		// generated class, so both need an explicit `(type) => X` — GraphQL can't infer
		// this from reflection metadata alone.
		if (isRelationOrComposite(dmmfField)) {
			decorator.params.push(`(type) => ${wrapIfList(dmmfField.type)}`)
		}

		if (dmmfField.kind === 'enum') {
			decorator.params.push(`(type) => ${wrapIfList(dmmfField.type)}`)
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
			if (isRelationOrComposite(dmmfField)) {
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
				return formatEnumDefault(dmmfField)
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
	 * `@ValidateNested()` for callers who *do* want NestJS's `ValidationPipe` (with
	 * `transform: true`) to recurse into relation/composite payloads as-is. The `@Type(() => X)`
	 * that makes `@ValidateNested()` actually recurse is generated separately in `convertField`
	 * — it's also needed by `useSerialization` independently of validation, so it has a single
	 * shared emission point instead of living inside this validator-specific method.
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

		if (isRelationOrComposite(dmmfField)) {
			if (this.config.validateNestedRelations) {
				decorators.push(
					new DecoratorComponent({
						name: 'ValidateNested',
						importFrom: 'class-validator',
						params: eachOption ? [eachOption] : [],
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
			// `nativeType` is `undefined` when a Prisma 5 CLI hands this generator a field
			// (the key is absent entirely -- still possible even though this repo's own pin
			// is on 7.x, since a Prisma 5 project's `prisma generate` can still spawn this
			// generator as a subprocess), `null` when the field has no `@db.*` annotation, or
			// `[typeName, args]`, e.g. `@db.VarChar(191)` -> `['VarChar', ['191']]`.
			const [nativeTypeName, nativeTypeArgs] = dmmfField.nativeType ?? []

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
		// `extractRelationFields` stays tri-state on purpose: `true` keeps only relation
		// fields, `false` keeps only non-relation ones, and unset keeps everything (see the
		// filter below) -- that's what makes one model produce both a base class and a
		// *Relations class under separateRelationFields.
		const {
			model,
			extractRelationFields,
			postfix,
			useGraphQL = false,
		} = input

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

		// shared filter -> map -> uniquify scaffolding for the "related type names" lists
		// below. The predicate is intentionally passed in rather than unified across call
		// sites -- relationTypes/typesTypes/enums each have genuinely different filter rules.
		const namesOf = (predicate: (field: DMMF.Field) => boolean): string[] =>
			uniquify(visibleFields.filter(predicate).map((field) => field.type))

		/** relation & enums */
		const relationTypes = namesOf(
			(field) =>
				!!field.relationName &&
				(this._config.separateRelationFields
					? true
					: model.name !== field.type),
		)

		const typesTypes = namesOf(
			(field) =>
				field.kind === 'object' &&
				model.name !== field.type &&
				!field.relationName,
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
			this.applyGraphQLClassDecoration(
				classComponent,
				classComponent.enumTypes,
			)
		}

		return classComponent
	}

	/** Adds the class-level `@ObjectType()` decorator and, if the class has enum fields, the
	 * `registerEnumType(...)` extra-code block that must run once per enum for @nestjs/graphql
	 * to resolve it. */
	private applyGraphQLClassDecoration(
		classComponent: ClassComponent,
		enumTypes: string[],
	): void {
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

		if (enumTypes.length > 0) {
			const extra = enumTypes
				.map(
					(enumType) => `registerEnumType(${enumType}, {
	name: "${enumType}"
})`,
				)
				.join('\r\n\r\n')

			classComponent.extra = extra
		}
	}

	/**
	 * one prisma model could generate multiple classes!
	 *
	 * CASE 1: if you want separate model to normal class and relation class
	 */
	getClasses = (): ClassComponent[] => {
		const models = this.dmmf.datamodel.models
		const useGraphQL = this.config.useGraphQL

		/** separateRelationFields */
		if (this.config.separateRelationFields === true) {
			const modelVariants: Pick<
				ConvertModelInput,
				'extractRelationFields' | 'postfix'
			>[] = [
				{ extractRelationFields: true, postfix: 'Relations' },
				{ extractRelationFields: false },
			]
			return [
				...modelVariants.flatMap((variant) =>
					models.map((model) =>
						this.getClass({ model, useGraphQL, ...variant }),
					),
				),
				// mongodb Types support
				...this.dmmf.datamodel.types.map((model) =>
					this.getClass({
						model,
						useGraphQL,
						extractRelationFields: true,
					}),
				),
			]
		}

		return [
			...models.map((model) => this.getClass({ model, useGraphQL })),
			// mongodb Types support
			...this.dmmf.datamodel.types.map((model) =>
				this.getClass({ model, useGraphQL }),
			),
		]
	}

	convertField = (dmmfField: DMMF.Field): FieldComponent => {
		const field = new FieldComponent({
			name: dmmfField.name,
			useUndefinedDefault: !!this._config.useUndefinedDefault,
		})
		const type = this.getPrimitiveMapTypeFromDMMF(dmmfField)

		if (this.config.useSwagger) {
			this.applySwaggerDecorators(dmmfField, field)
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

		if (this.config.useSerialization) {
			this.applySerializationDirectives(dmmfField, field)
		}

		// class-transformer needs @Type(() => X) on a relation/composite field to turn a plain
		// nested object into an instance of the related class -- without it, neither
		// class-validator's @ValidateNested() has anything to recurse into, nor does a
		// ClassSerializerInterceptor apply the nested class's own @Exclude()/@Expose() when
		// serializing a response. That makes this needed by useSerialization on its own, not
		// just by useValidation's validateNestedRelations -- checked here once so it's never
		// generated twice when both options are on.
		const isNestedField = isRelationOrComposite(dmmfField)
		const needsTypeDecorator =
			isNestedField &&
			(this.config.useSerialization ||
				(this.config.useValidation &&
					this.config.validateNestedRelations))
		if (needsTypeDecorator) {
			field.decorators.push(
				new DecoratorComponent({
					name: 'Type',
					importFrom: 'class-transformer',
					params: [wrapArrowFunction(dmmfField)],
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
					field.default = formatEnumDefault(dmmfField)
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

	private applySwaggerDecorators(
		dmmfField: DMMF.Field,
		field: FieldComponent,
	): void {
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

	private applySerializationDirectives(
		dmmfField: DMMF.Field,
		field: FieldComponent,
	): void {
		// `/// @exclude` keeps the field on the class but adds class-transformer's @Exclude(),
		// so a ClassSerializerInterceptor strips it from responses -- for fields like
		// passwordHash that the class needs at the type level but should never be serialized.
		if (hasFieldDirective(dmmfField.documentation, 'exclude')) {
			field.decorators.push(
				new DecoratorComponent({
					name: 'Exclude',
					importFrom: 'class-transformer',
				}),
			)
		}

		// `/// @expose` is @exclude's counterpart for the opposite class-transformer strategy:
		// projects that call plainToInstance(cls, data, { excludeExtraneousValues: true }) treat
		// every field as hidden unless explicitly marked, so @Expose() opts a field back in.
		if (hasFieldDirective(dmmfField.documentation, 'expose')) {
			field.decorators.push(
				new DecoratorComponent({
					name: 'Expose',
					importFrom: 'class-transformer',
				}),
			)
		}
	}
}
