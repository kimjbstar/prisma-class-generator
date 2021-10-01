import { GeneratorOptions } from '@prisma/generator-helper'
import { Dictionary, parseEnvValue } from '@prisma/sdk'
import { GeneratorFormatNotValidError } from '..'
import { convertModels } from '../convertor'

export interface PrismaClassGeneratorOptions {
	useSwagger: boolean
	dryRun: boolean
}

export class PrismaClassGenerator {
	static instance: PrismaClassGenerator

	static getInstance() {
		if (PrismaClassGenerator.instance) {
			return PrismaClassGenerator.instance
		}
		PrismaClassGenerator.instance = new PrismaClassGenerator()
		return PrismaClassGenerator.instance
	}

	run = async (options: GeneratorOptions): Promise<any> => {
		const output = parseEnvValue(options.generator.output!)
		const { generator, dmmf } = options

		const config = this.setConfig(generator.config)
		const { dryRun } = config

		const prismaClasses = convertModels(dmmf, config)
		const files = prismaClasses.map((_class) => _class.toFileClass(output))

		// TODO : check import path each other

		files.forEach((_file) => {
			_file.write(dryRun)
		})

		return null
	}

	setConfig = (config: Dictionary<string>): PrismaClassGeneratorOptions => {
		const result = Object.assign(
			{
				useSwagger: true,
				dryRun: true,
			},
			config,
		)
		result.useSwagger = this.parseBoolean(result.useSwagger)
		result.dryRun = this.parseBoolean(result.dryRun)

		console.log(result)

		return result
	}

	parseBoolean(value: unknown): boolean {
		if (['true', 'false'].includes(value.toString()) === false) {
			throw new GeneratorFormatNotValidError(config)
		}
		return value.toString() === 'true'
	}
}
