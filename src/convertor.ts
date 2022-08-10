import { DMMF } from '@prisma/generator-helper'
import { PrismaClass } from './components/class'
import { PrismaDecorator } from './components/decorator'
import { PrismaField } from './components/field'
import { PrismaClassGeneratorConfig } from './generator'
import {
	arrayify,
	capitalizeFirst,
	uniquify,
	wrapArrowFunction,
	wrapQuote,
} from './util'

const primitiveMapType: Record<any, string> = {
	Int: 'number',
	String: 'string',
	DateTime: 'Date',
	Boolean: 'boolean',
	Json: 'any',
	BigInt: 'BigInt',
	Float: 'number',
	Decimal: 'number',
	Bytes: 'Buffer',
}

export interface ConvertModelInput {
	model: DMMF.Model
	extractRelationFields?: boolean
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

	getPrimitiveMapTypeFromDMMF = (dmmfField: DMMF.Field): string => {
		if (typeof dmmfField.type !== 'string') {
			return 'unknown'
		}
		return primitiveMapType[dmmfField.type]
	}

	extractSwaggerDecoratorFromField = (
		dmmfField: DMMF.Field,
	): PrismaDecorator => {
		const options: Record<string, any> = {}
		const name =
			dmmfField.isRequired === true
				? 'ApiProperty'
				: 'ApiPropertyOptional'
		const decorator = new PrismaDecorator({
			name,
			importFrom: '@nestjs/swagger',
		})

		let type = this.getPrimitiveMapTypeFromDMMF(dmmfField)
		if (type && type !== 'any') {
			options.type = capitalizeFirst(type)
			decorator.params.push(options)
			return decorator
		}
		type = dmmfField.type.toString()

		if (dmmfField.isList) {
			options['isArray'] = true
		}

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

	convertModel = (input: ConvertModelInput): PrismaClass => {
		const { useSwagger } = this.config
		const options = Object.assign(
			{
				extractRelationFields: null,
			},
			input,
		)
		const { model, extractRelationFields = null } = options

		let modelName = model.name
		if (extractRelationFields === true) {
			modelName += 'Relations'
		}
		const pClass = new PrismaClass({ name: modelName })

		const relationTypes = model.fields
			.filter((field) => field.relationName && model.name !== field.type)
			.map((v) => v.type)
		const enums = model.fields.filter((field) => field.kind === 'enum')

		pClass.fields = model.fields
			.filter((field) => {
				if (extractRelationFields === true) {
					return field.relationName
				}
				if (extractRelationFields === false) {
					return !field.relationName
				}
				return true
			})
			.map((field) => {
				const converted = this.convertField(field)
				if (useSwagger) {
					converted.decorators.push(
						this.extractSwaggerDecoratorFromField(field),
					)
				}
				return converted
			})
		pClass.relationTypes =
			extractRelationFields === false ? [] : uniquify(relationTypes)

		pClass.enumTypes =
			extractRelationFields === true
				? []
				: enums.map((field) => field.type.toString())

		return pClass
	}

	/**
	 * one prisma model could generate multiple classes!
	 *
	 * CASE 1: if you want separate model to normal class and relation class
	 */
	getClasses = (): PrismaClass[] => {
		/** seperateRelationFields */
		if (this.config.seperateRelationFields === true) {
			return [
				...this.dmmf.datamodel.models.map((model) =>
					this.convertModel({
						model,
						extractRelationFields: true,
					}),
				),
				...this.dmmf.datamodel.models.map((model) =>
					this.convertModel({
						model,
						extractRelationFields: false,
					}),
				),
			]
		}

		return this.dmmf.datamodel.models.map((model) =>
			this.convertModel({ model }),
		)
	}

	convertField = (dmmfField: DMMF.Field): PrismaField => {
		const field = new PrismaField({
			name: dmmfField.name,
		})
		let type = this.getPrimitiveMapTypeFromDMMF(dmmfField)

		if (dmmfField.isRequired === false) {
			field.nullable = true
		}

		if (dmmfField.default) {
			if (typeof dmmfField.default !== 'object') {
				field.default = dmmfField.default?.toString()
				if (dmmfField.kind === 'enum') {
					field.default = `${dmmfField.type}.${dmmfField.default}`
				} else if (dmmfField.type === 'String') {
					field.default = `'${field.default}'`
				}
			}
		}

		if (type) {
			field.type = type
			return field
		}
		field.type = dmmfField.type

		if (dmmfField.isList) {
			field.type = arrayify(field.type)
		}

		return field
	}
}
