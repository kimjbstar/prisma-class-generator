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

	static getInstance() {
		if (PrismaClassGenerator.instance) {
			return PrismaClassGenerator.instance
		}
		PrismaClassGenerator.instance = new PrismaClassGenerator()
		return PrismaClassGenerator.instance
	}

	setPrismaClientPath(options: GeneratorOptions) {
		const { otherGenerators, schemaPath } = options

		PrismaClassFile.ROOT_PATH = schemaPath.replace(
			'/prisma/schema.prisma',
			'',
		)
		const prismaClientGenerator = otherGenerators.find(
			(g) => g.provider.value === 'prisma-client-js',
		)
		let found
		if (prismaClientGenerator === null) {
			found = path.resolve(
				PrismaClassFile.ROOT_PATH,
				'node_modules/@prisma/client',
			)
		} else {
			found = prismaClientGenerator.output.value
		}
		PrismaClassFile.PRISMA_CLIENT_PATH = found
	}

	run = async (options: GeneratorOptions): Promise<any> => {
		// TODO : error handling
		const { generator, dmmf } = options
		const output = parseEnvValue(generator.output!)

		const config = this.setConfig(generator.config)

		this.setPrismaClientPath(options)

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

		return result
	}

	parseBoolean(value: unknown): boolean {
		if (['true', 'false'].includes(value.toString()) === false) {
			throw new GeneratorFormatNotValidError('parseBoolean failed')
		}
		return value.toString() === 'true'
	}
}
