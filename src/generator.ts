import { GeneratorOptions } from '@prisma/generator-helper'
import { parseEnvValue } from '@prisma/internals'
import * as path from 'path'
import { GeneratorPathNotExists } from './error-handler'
import { PrismaConvertor } from './convertor'
import {
	getRelativeTSPath,
	parseBoolean,
	prettierFormat,
	writeTSFile,
} from './util'
import { INDEX_TEMPLATE } from './templates/index.template'
import { ImportComponent } from './components/import.component'
import * as prettier from 'prettier'
import { FileComponent } from './components/file.component'

export const GENERATOR_NAME = 'Prisma Class Generator'
export interface PrismaClassGeneratorConfig {
	useSwagger: boolean
	dryRun: boolean
	makeIndexFile: boolean
	separateRelationFields: boolean
	use: boolean
}

export class PrismaClassGenerator {
	static instance: PrismaClassGenerator
	_options: GeneratorOptions
	_prettierOptions: prettier.Options
	rootPath: string
	clientPath: string

	constructor(options?: GeneratorOptions) {
		if (options) {
			this.options = options
		}
		const output = parseEnvValue(options.generator.output!)
		this.prettierOptions =
			prettier.resolveConfig.sync(output, { useCache: false }) ||
			prettier.resolveConfig.sync(path.dirname(require.main.filename), {
				useCache: false,
			})
	}

	public get options() {
		return this._options
	}

	public set options(value) {
		this._options = value
	}

	public get prettierOptions() {
		return this._prettierOptions
	}

	public set prettierOptions(value) {
		this._prettierOptions = value
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

		const classes = convertor.getClasses()
		const files = classes.map(
			(classComponent) => new FileComponent({ classComponent, output }),
		)

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
		if (config.makeIndexFile) {
			const indexFilePath = path.resolve(output, 'index.ts')
			const imports = files.map(
				(fileRow) =>
					new ImportComponent(
						getRelativeTSPath(indexFilePath, fileRow.getPath()),
						fileRow.prismaClass.name,
					),
			)

			const content = INDEX_TEMPLATE.replace(
				'#!{IMPORTS}',
				imports.map((i) => i.echo('_')).join('\r\n'),
			)
				.replace(
					'#!{RE_EXPORT_CLASSES}',
					files
						.map((f) => `	${f.prismaClass.reExportPrefixed('_')}`)
						.join('\r\n'),
				)
				.replace(
					'#!{CLASSES}',
					files.map((f) => f.prismaClass.name).join(', '),
				)
			const formattedContent = prettierFormat(
				content,
				this.prettierOptions,
			)
			writeTSFile(indexFilePath, formattedContent, config.dryRun)
		}
		return
	}

	getConfig = (): PrismaClassGeneratorConfig => {
		const config = this.options.generator.config
		const result = Object.assign(
			{
				use: true,
				useSwagger: true,
				dryRun: true,
				makeIndexFile: true,
				separateRelationFields: false,
			},
			config,
		)
		result.useSwagger = parseBoolean(result.useSwagger)
		result.dryRun = parseBoolean(result.dryRun)
		result.makeIndexFile = parseBoolean(result.makeIndexFile)
		result.separateRelationFields = parseBoolean(
			result.separateRelationFields,
		)

		return result
	}
}
