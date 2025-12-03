import { DMMF } from '@prisma/generator-helper'
import { ClassComponent } from './components/class.component'
import { DecoratorComponent } from './components/decorator.component'
import { FieldComponent } from './components/field.component'
import { PrismaClassGeneratorConfig } from './generator'
import { arrayify, capitalizeFirst, uniquify, wrapArrowFunction, wrapQuote, } from './util'

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
	typeof primitiveMapType[PrimitiveMapTypeKeys]

export interface SwaggerDecoratorParams {
	isArray?: boolean
	type?: string
	enum?: string
	enumName?: string
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
				grahQLType = 'Int'
			}
			if (dmmfField.isList) {
				grahQLType = `[${grahQLType}]`
			}
			decorator.params.push(`(type) => ${grahQLType}`)
		}

		if (dmmfField.relationName) {
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
			decorator.params.push(options)
			return decorator
		}
		type = dmmfField.type.toString()

		if (dmmfField.relationName) {
			options.type = wrapArrowFunction(dmmfField)
			decorator.params.push(options)
			return decorator
		}

		if (dmmfField.kind === 'enum') {
			options.enum = dmmfField.type
			options.enumName = wrapQuote(dmmfField)
		}

		decorator.params.push(options)
		return decorator
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

		/** relation & enums */
		const relationTypes = uniquify(
			model.fields
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
			model.fields
				.filter(
					(field) =>
						field.kind == 'object' &&
						model.name !== field.type &&
						!field.relationName,
				)
				.map((v) => v.type),
		)

		const enums = model.fields.filter((field) => field.kind === 'enum')

		classComponent.fields = model.fields
			.filter((field) => {
				if (extractRelationFields === true) {
					return field.relationName
				}
				if (extractRelationFields === false) {
					return !field.relationName
				}
				return true
			})
			.map((field) => this.convertField(field, extractRelationFields))
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
					description:
						'generated by [prisma-class-generator](https://github.com/kimjbstar/prisma-class-generator)',
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

	extractClassValidatorDecoratorsFromField = (dmmfField: DMMF.Field) => {
		const documentation = dmmfField.documentation?.split(' ') ?? [];
		const decorators = [];

		const type = dmmfField.type;

		if(dmmfField.isRequired){
			decorators.push(new DecoratorComponent({
				name: 'IsDefined',
				importFrom: 'class-validator',
			}));
		}else{
			decorators.push(new DecoratorComponent({
				name: 'IsOptional',
				importFrom: 'class-validator',
			}));
		}

		if(dmmfField.relationName){
			// is relation => ValidateNested
			decorators.push(new DecoratorComponent({
				name: 'ValidateNested',
				importFrom: 'class-validator',
			}))

			return decorators;
		}

		if(dmmfField.kind === 'enum'){
			decorators.push(new DecoratorComponent({
				name: 'IsEnum',
				importFrom: 'class-validator',
				params: [dmmfField.type],
			}))
		}

		if (documentation.length > 0) {
			if(documentation.includes('isEmail')){
				decorators.push(new DecoratorComponent({
					name: 'IsEmail',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.includes('isUrl')){
				decorators.push(new DecoratorComponent({
					name: 'IsUrl',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.includes('isAlpha')){
				decorators.push(new DecoratorComponent({
					name: 'IsAlpha',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.includes('isAlphanumeric')){
				decorators.push(new DecoratorComponent({
					name: 'IsAlphanumeric',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.includes('isAscii')){
				decorators.push(new DecoratorComponent({
					name: 'IsAscii',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.includes('isBase64')){
				decorators.push(new DecoratorComponent({
					name: 'IsBase64',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.includes('isCreditCard')){
				decorators.push(new DecoratorComponent({
					name: 'IsCreditCard',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.includes('isCurrency')){
				decorators.push(new DecoratorComponent({
					name: 'IsCurrency',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.includes('isDecimal')){
				decorators.push(new DecoratorComponent({
					name: 'IsDecimal',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.includes('isFQDN')){
				decorators.push(new DecoratorComponent({
					name: 'IsFQDN',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.includes('isHash')){
				decorators.push(new DecoratorComponent({
					name: 'IsHash',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.includes('isHexColor')){
				decorators.push(new DecoratorComponent({
					name: 'IsHexColor',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.includes('isHexadecimal')){
				decorators.push(new DecoratorComponent({
					name: 'IsHexadecimal',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.includes('isIP')){
				decorators.push(new DecoratorComponent({
					name: 'IsIP',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.includes('isISBN')){
				decorators.push(new DecoratorComponent({
					name: 'IsISBN',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.includes('isISIN')){
				decorators.push(new DecoratorComponent({
					name: 'IsISIN',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.includes('isISO8601')){
				decorators.push(new DecoratorComponent({
					name: 'IsISO8601',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.includes('isJWT')){
				decorators.push(new DecoratorComponent({
					name: 'IsJWT',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.includes('isLatLong')){
				decorators.push(new DecoratorComponent({
					name: 'IsLatLong',
					importFrom: 'class-validator',
				}))
			}

			if(documentation.some(s => s.startsWith('minLength:'))){
				const parts = documentation.find(s => s.includes('minLength:')).split(':');
				const value = parts[1];
				decorators.push(new DecoratorComponent({
					name: 'MinLength',
					params: [value],
					importFrom: 'class-validator',
				}))
			}

			if(documentation.some(s => s.startsWith('maxLength:'))){
				const parts = documentation.find(s => s.includes('maxLength:')).split(':');
				const value = parts[1];
				decorators.push(new DecoratorComponent({
					name: 'MaxLength',
					params: [value],
					importFrom: 'class-validator',
				}))
			}

			if(documentation.some(s => s.startsWith('min:'))){
				const parts = documentation.find(s => s.includes('min:')).split(':');
				const value = parts[1];
				decorators.push(new DecoratorComponent({
					name: 'Min',
					params: [value],
					importFrom: 'class-validator',
				}))
			}

			if(documentation.some(s => s.startsWith('max:'))){
				const parts = documentation.find(s => s.includes('max:')).split(':');
				const value = parts[1];
				decorators.push(new DecoratorComponent({
					name: 'Max',
					params: [value],
					importFrom: 'class-validator',
				}))
			}

			if(documentation.some(s => s.startsWith('in:'))){
				const parts = documentation.find(s => s.includes('in:')).split(':');
				const value = parts[1];
				decorators.push(new DecoratorComponent({
					name: 'IsIn',
					params: [...value.split(',')],
					importFrom: 'class-validator',
				}))
			}

			if(documentation.some(s => s.startsWith('isDivisibleBy:'))){
				const parts = documentation.find(s => s.includes('isDivisibleBy:')).split(':');
				const value = parts[1];
				decorators.push(new DecoratorComponent({
					name: 'IsDivisibleBy',
					params: [value],
					importFrom: 'class-validator',
				}))
			}

		}else{
			// basic validation of types (IsString, etc...)

			if(type === 'String'){
				decorators.push(new DecoratorComponent({
					name: 'IsString',
					importFrom: 'class-validator',
				}))
			}

			if(type === 'Json'){
				decorators.push(new DecoratorComponent({
					name: 'IsObject',
					importFrom: 'class-validator',
				}))
			}

			if(type === 'Int'){
				decorators.push(new DecoratorComponent({
					name: 'IsInt',
					importFrom: 'class-validator',
				}))
			}

			if(type === 'Boolean'){
				decorators.push(new DecoratorComponent({
					name: 'IsBoolean',
					importFrom: 'class-validator',
				}))
			}

			if(type === 'BigInt'){
				decorators.push(new DecoratorComponent({
					name: 'IsInt',
					importFrom: 'class-validator',
				}))
			}

			if(type === 'DateTime'){
				decorators.push(new DecoratorComponent({
					name: 'IsDateString',
					importFrom: 'class-validator',
				}))
			}
		}

		return decorators;
	}

	convertField = (dmmfField: DMMF.Field, relationField: boolean): FieldComponent => {
		const field = new FieldComponent({
			name: dmmfField.name,
			useUndefinedDefault: this._config.useUndefinedDefault,
		})
		let type = this.getPrimitiveMapTypeFromDMMF(dmmfField)

		if (this.config.useSwagger) {
			const decorator = this.extractSwaggerDecoratorFromField(dmmfField)
			field.decorators.push(decorator)
		}

		if(this.config.useClassValidator){
			const decorators = this.extractClassValidatorDecoratorsFromField(dmmfField);
			field.decorators.push(...decorators)
		}

		if (this.config.useGraphQL) {
			const decorator =
				this.extractTypeGraphQLDecoratorFromField(dmmfField)
			if (decorator) {
				field.decorators.push(decorator)
			}
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
				} else if (dmmfField.type === 'Int') {
					field.default = `${field.default}`
				} else if (dmmfField.type === 'String') {
					field.default = `'${field.default}'`
				}
			} else if (Array.isArray(dmmfField.default)) {
				if (dmmfField.type === 'String') {
					field.default = `[${dmmfField.default
						.map((d) => `'${d}'`)
						.toString()}]`
				} else {
					field.default = `[${dmmfField.default.toString()}]`
				}
			} else if (dmmfField.type === 'DateTime') {
				const defaultDateStr = JSON.stringify(dmmfField.default);
				if (defaultDateStr.includes('now')) {
					field.default = 'new Date()';
				} else {
					field.default = `new Date('${defaultDateStr}')`
				}
			}
		}

		if (dmmfField.isUpdatedAt) {
			field.default = 'new Date()'
		}

		if (type) {
			field.type = type
		} else {
			field.type = dmmfField.type
		}

		if (dmmfField.isList) {
			field.type = arrayify(field.type)
		}

		return field
	}
}
