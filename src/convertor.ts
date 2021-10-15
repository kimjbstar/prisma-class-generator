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

const primitiveMapType: Record<string, string> = {
	Int: 'number',
	String: 'string',
	DateTime: 'Date',
	Boolean: 'boolean',
	Json: 'any',
	BigInt: 'bigint',
	Float: 'number',
	Decimal: 'number',
	Bytes: 'Buffer',
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

	extractSwaggerDecoratorFromField = (
		dmmfField: DMMF.Field,
	): PrismaDecorator => {
		const options: Record<string, any> = {}
		const decorator = new PrismaDecorator({
			name: 'ApiProperty',
			importFrom: '@nestjs/swagger',
		})

		let type = primitiveMapType[dmmfField.type]
		if (type && type !== 'any') {
			options.type = capitalizeFirst(type)
			decorator.params.push(options)
			return decorator
		}
		type = dmmfField.type

		if (dmmfField.isList) {
			options['isArray'] = true
		}

		if (dmmfField.relationName) {
			options.type = wrapArrowFunction(dmmfField.type)
			decorator.params.push(options)
			return decorator
		}

		if (dmmfField.kind === 'enum') {
			options.enum = dmmfField.type
			options.enumName = wrapQuote(dmmfField.type)
		}

		decorator.params.push(options)
		return decorator
	}

	convertModel = (model: DMMF.Model): PrismaClass => {
		const { useSwagger } = this.config

		const pClass = new PrismaClass({
			name: model.name,
		})

		const fields = model.fields.map((field) => {
			const converted = this.convertField(field)
			if (useSwagger) {
				const decorator = this.extractSwaggerDecoratorFromField(field)
				converted.decorators.push(decorator)
			}
			// console.dir(converted, { depth: null })
			return converted
		})

		const relationTypes = model.fields
			.filter((field) => field.relationName && model.name !== field.type)
			.map((v) => v.type)
		const enums = model.fields.filter((field) => field.kind === 'enum')

		pClass.fields = fields
		pClass.relationTypes = uniquify(relationTypes)
		pClass.enumTypes = enums.map((field) => field.type)

		return pClass
	}

	convertModels = (): PrismaClass[] => {
		return this.dmmf.datamodel.models.map((model) =>
			this.convertModel(model),
		)
	}

	convertField = (dmmfField: DMMF.Field): PrismaField => {
		const field = new PrismaField({
			name: dmmfField.name,
		})
		let type = primitiveMapType[dmmfField.type]

		if (type) {
			field.type = type

			if (dmmfField.isList) {
				field.type = arrayify(type)
			}

			return field
		}
		field.type = dmmfField.type

		if (dmmfField.isList) {
			field.type = arrayify(field.type)
		}

		return field
	}
}
