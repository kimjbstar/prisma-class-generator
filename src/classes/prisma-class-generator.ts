import { GeneratorOptions } from '@prisma/generator-helper'
import { Dictionary, parseEnvValue } from '@prisma/sdk'
import * as path from 'path'
import { GeneratorFormatNotValidError } from '../error-handler'
import { convertModels } from '../convertor'
import { PrismaClassFile } from './prisma-class-file'

export const GENERATOR_NAME = 'Prisma Class Generator'
export interface PrismaClassGeneratorOptions {
	useSwagger: boolean
	dryRun: boolean
}

export class PrismaClassGenerator {
	static instance: PrismaClassGenerator
	_options: GeneratorOptions

	constructor(options: GeneratorOptions) {
		this.options = options
	}

	public get options() {
		return this._options
	}

	public set options(value) {
		this._options = value
	}

	static getInstance(options: GeneratorOptions) {
		if (PrismaClassGenerator.instance) {
			return PrismaClassGenerator.instance
		}
		PrismaClassGenerator.instance = new PrismaClassGenerator(options)
		return PrismaClassGenerator.instance
	}

	setPrismaClientPath() {
		const { otherGenerators, schemaPath } = this.options

		// TODO : remove static variable
		PrismaClassFile.ROOT_PATH = schemaPath.replace(
			'/prisma/schema.prisma',
			'',
		)
		const defaultPath = path.resolve(
			PrismaClassFile.ROOT_PATH,
			'node_modules/@prisma/client',
		)
		const clientGenerator = otherGenerators.find(
			(g) => g.provider.value === 'prisma-client-js',
		)

		PrismaClassFile.PRISMA_CLIENT_PATH =
			clientGenerator?.output.value ?? defaultPath
	}

	run = async (): Promise<any> => {
		const { generator, dmmf } = this.options
		const output = parseEnvValue(generator.output!)

		const config = this.getConfig()
		this.setPrismaClientPath()

		const prismaClasses = convertModels(dmmf, config)
		const files = prismaClasses.map((c) => c.toFileClass(output))

		// match relative imports
		const classToPath = files.reduce((result, fileRow) => {
			const fullPath = path.resolve(fileRow.dir, fileRow.filename)
			result[fileRow.prismaClass.name] = fullPath
			return result
		}, {} as Record<string, string>)

		files.forEach((fileRow) => {
			fileRow.imports = fileRow.imports.map((importRow) => {
				const pathToReplace = importRow.getReplacePath(classToPath)
				if (pathToReplace !== null) {
					importRow.from = fileRow.getRelativePath(pathToReplace)
				}
				return importRow
			})
		})

		files.forEach((fileRow) => {
			fileRow.write(config.dryRun)
		})
		return null
	}

	getConfig = (): PrismaClassGeneratorOptions => {
		const config = this.options.generator.config
		const result = Object.assign(
			{
				useSwagger: true,
				dryRun: true,
			},
			config,
		)
		result.useSwagger = this.parseBoolean(result.useSwagger)
		result.dryRun = this.parseBoolean(result.dryRun)

		return result
	}

	parseBoolean(value: unknown): boolean {
		if (['true', 'false'].includes(value.toString()) === false) {
			throw new GeneratorFormatNotValidError('parseBoolean failed')
		}
		return value.toString() === 'true'
	}
}
