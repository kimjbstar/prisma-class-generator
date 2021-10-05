import { GeneratorOptions } from '@prisma/generator-helper'
import { Dictionary, parseEnvValue } from '@prisma/sdk'
import { doNothing, getRelativePath } from '../util'
import * as path from 'path'
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
		// TODO : error handling
		const output = parseEnvValue(options.generator.output!)
		const { generator, dmmf } = options

		const config = this.setConfig(generator.config)
		const { dryRun } = config

		const prismaClasses = convertModels(dmmf, config)
		const files = prismaClasses.map((_class) => _class.toFileClass(output))

		const classToFilePath = files.reduce((result, fileRow) => {
			const fullPath = path.resolve(fileRow.dir, fileRow.filename)
			result[fileRow.prismaClass.name] = fullPath
			return result
		}, {} as Record<string, string>)

		files.forEach((fileRow) => {
			fileRow.imports = fileRow.imports.map((importRow) => {
				if (classToFilePath[importRow.from]) {
					importRow.from = getRelativePath(
						fileRow.getPath(),
						classToFilePath[importRow.from],
					)
				}
				return importRow
			})
		})

		console.log(files)

		files.forEach((fileRow) => {
			fileRow.write(false)
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
			throw new GeneratorFormatNotValidError(config)
		}
		return value.toString() === 'true'
	}
}
