import { DMMF } from '@prisma/generator-helper'
import { PrismaClass } from './classes/prisma-class'
import { PrismaDecorator } from './classes/prisma-decorator'
import { PrismaField } from './classes/prisma-field'
import { PrismaClassGeneratorOptions } from './classes/prisma-class-generator'
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

export const extractSwaggerDecoratorFromField = (
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

export const convertField = (dmmfField: DMMF.Field): PrismaField => {
	const field = new PrismaField({
		name: dmmfField.name,
	})
	let type = primitiveMapType[dmmfField.type]

	if (type) {
		field.type = type
		return field
	}
	type = dmmfField.type

	if (dmmfField.isList) {
		field.type = arrayify(type)
	}

	if (dmmfField.relationName) {
		field.type = `${type}`
		return field
	}

	if (dmmfField.kind === 'enum') {
		field.type = dmmfField.type
	}

	return field
}

export const convertModels = (
	dmmf: DMMF.Document,
	config: PrismaClassGeneratorOptions,
): PrismaClass[] => {
	return dmmf.datamodel.models.map((model) =>
		convertModel({
			model: model,
			config: config,
		}),
	)
}

export const convertModel = (input: {
	model: DMMF.Model
	config: PrismaClassGeneratorOptions
}): PrismaClass => {
	const { model, config } = input
	const { useSwagger } = config

	const pClass = new PrismaClass({
		name: model.name,
	})

	const fields = model.fields.map((field) => {
		const converted = convertField(field)
		if (useSwagger) {
			const decorator = extractSwaggerDecoratorFromField(field)
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

	const apiExtraModelsDecorator = new PrismaDecorator({
		name: 'ApiExtraModels',
		params: pClass.name,
		importFrom: '@nestjs/swagger',
	})
	pClass.decorators.push(apiExtraModelsDecorator)

	return pClass
}
