import { GeneratorOptions } from '@prisma/generator-helper'
import { parseEnvValue } from '@prisma/sdk'
import * as path from 'path'
import { GeneratorPathNotExists } from '@src/error-handler'
import { PrismaConvertor } from '@src/convertor'
import { parseBoolean } from '@src/util'

export const GENERATOR_NAME = 'Prisma Class Generator'
export interface PrismaClassGeneratorConfig {
	useSwagger: boolean
	dryRun: boolean
}

export class PrismaClassGenerator {
	static instance: PrismaClassGenerator
	_options: GeneratorOptions
	rootPath: string
	clientPath: string

	constructor(options?: GeneratorOptions) {
		if (options) {
			this.options = options
		}
	}

	public get options() {
		return this._options
	}

	public set options(value) {
		this._options = value
	}

	static getInstance(options?: GeneratorOptions) {
		if (PrismaClassGenerator.instance) {
			return PrismaClassGenerator.instance
		}
		PrismaClassGenerator.instance = new PrismaClassGenerator(options)
		return PrismaClassGenerator.instance
	}

	getClientImportPath() {
		if (!this.rootPath || !this.clientPath) {
			throw new GeneratorPathNotExists()
		}
		return path
			.relative(this.rootPath, this.clientPath)
			.replace('node_modules/', '')
	}

	setPrismaClientPath(): void {
		const { otherGenerators, schemaPath } = this.options

		this.rootPath = schemaPath.replace('/prisma/schema.prisma', '')
		const defaultPath = path.resolve(
			this.rootPath,
			'node_modules/@prisma/client',
		)
		const clientGenerator = otherGenerators.find(
			(g) => g.provider.value === 'prisma-client-js',
		)

		this.clientPath = clientGenerator?.output.value ?? defaultPath
	}

	run = async (): Promise<void> => {
		const { generator, dmmf } = this.options
		const output = parseEnvValue(generator.output!)
		const config = this.getConfig()
		this.setPrismaClientPath()

		const convertor = PrismaConvertor.getInstance()
		convertor.dmmf = dmmf
		convertor.config = config

		const prismaClasses = convertor.convertModels()
		const files = prismaClasses.map((c) => c.toFileClass(output))

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
		return
	}

	getConfig = (): PrismaClassGeneratorConfig => {
		const config = this.options.generator.config
		const result = Object.assign(
			{
				useSwagger: true,
				dryRun: true,
			},
			config,
		)
		result.useSwagger = parseBoolean(result.useSwagger)
		result.dryRun = parseBoolean(result.dryRun)

		return result
	}
}
