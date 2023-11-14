import { GeneratorOptions } from '@prisma/generator-helper'
import { parseEnvValue } from '@prisma/internals'
import * as path from 'path'
import { PrismaConvertor } from './convertor'
import {
	getRelativeTSPath,
	parseBoolean,
	parseNumber,
	prettierFormat,
	writeTSFile,
} from './util'
import { INDEX_TEMPLATE } from './templates/index.template'
import { ImportComponent } from './components/import.component'
import * as prettier from 'prettier'
import { FileComponent } from './components/file.component'

export const GENERATOR_NAME = 'Prisma Class Generator'

export const PrismaClassGeneratorOptions = {
	makeIndexFile: {
		desc: 'make index file',
		defaultValue: true,
	},
	dryRun: {
		desc: 'dry run',
		defaultValue: true,
	},
	separateRelationFields: {
		desc: 'separate relation fields',
		defaultValue: false,
	},
	useSwagger: {
		desc: 'use swagger decorstor',
		defaultValue: true,
	},
	useGraphQL: {
		desc: 'use graphql',
		defaultValue: false,
	},
	useUndefinedDefault: {
		desc: 'use undefined default',
		defaultValue: false,
	},
	clientImportPath: {
		desc: 'set prisma import path instead @prisma/client',
		defaultValue: undefined,
	},
	useNonNullableAssertions: {
		desc: 'applies non-nullable assertions (!) to class properties',
		defaultValue: false,
	},
	preserveDefaultNullable: {
		defaultValue: false,
		desc: 'preserve default nullable behavior',
	},
} as const

export type PrismaClassGeneratorOptionsKeys =
	keyof typeof PrismaClassGeneratorOptions
export type PrismaClassGeneratorConfig = Partial<
	Record<PrismaClassGeneratorOptionsKeys, any>
>

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

	getClientImportPath(): string {
		const result = this.options.generator.config.clientImportPath
		if (!result) {
			return '@prisma/client'
		}
		if (Array.isArray(result)) {
			return result[0]
		}
		return result
	}

	/** set clientPath to absolute prisma client path */
	setPrismaClientPath(): void {
		const { otherGenerators, schemaPath } = this.options

		const clientGenerator = otherGenerators.find(
			(g) => g.provider.value === 'prisma-client-js',
		)

		this.rootPath = schemaPath.replace('/prisma/schema.prisma', '')
		this.clientPath = clientGenerator.output.value
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

		const result: PrismaClassGeneratorConfig = {}
		for (const optionName in PrismaClassGeneratorOptions) {
			const { defaultValue } = PrismaClassGeneratorOptions[optionName]
			result[optionName] = defaultValue

			const value = config[optionName]
			if (value) {
				if (typeof defaultValue === 'boolean') {
					result[optionName] = parseBoolean(value)
				} else if (typeof defaultValue === 'number') {
					result[optionName] = parseNumber(value)
				} else {
					result[optionName] = value
				}
			}
		}

		return result
	}
}
