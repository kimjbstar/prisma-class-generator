import { GeneratorOptions } from '@prisma/generator-helper'
import { Dictionary, parseEnvValue } from '@prisma/sdk'
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
		this.instance = new PrismaClassGenerator()
		return this.instance
	}

	run = async (options: GeneratorOptions): Promise<any> => {
		const output = parseEnvValue(options.generator.output!)
		const { generator, dmmf } = options
		this.validateGeneratorConfig(generator.config)
		const config = this.applyDefaultConfig(generator.config)
		const { dryRun } = config

		const prismaClasses = convertModels(dmmf, config)
		const files = prismaClasses.map((_class) => _class.toFileClass(output))

		// TODO : check import path each other

		files.forEach((_file) => {
			_file.write(dryRun)
		})

		return null
	}

	validateGeneratorConfig = (config: Dictionary<string>) => {
		return true
	}

	applyDefaultConfig = (
		config: Dictionary<string>,
	): PrismaClassGeneratorOptions => {
		return Object.assign(
			{
				useSwagger: true,
				dryRun: true,
			},
			config,
		) as PrismaClassGeneratorOptions
	}
}
