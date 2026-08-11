import { GeneratorOptions } from '@prisma/generator-helper'
import { parseEnvValue } from '@prisma/internals'
import * as path from 'path'
import { PrismaConvertor } from './convertor'
import {
	getRelativeTSPath,
	log,
	parseBoolean,
	parseNumber,
	prettierFormat,
	writeTSFile,
} from './util'
import { INDEX_TEMPLATE } from './templates/index.template'
import { ImportComponent } from './components/import.component'
import * as prettier from 'prettier'
import { FileComponent } from './components/file.component'
import { GeneratorPathNotExists } from './error-handler'

export const GENERATOR_NAME = 'Prisma Class Generator'
export const REPO_URL = 'https://github.com/kimjbstar/prisma-class-generator'

/** Prisma 7 renamed the default client generator from 'prisma-client-js' to 'prisma-client'. Support both. */
export const PRISMA_CLIENT_GENERATOR_PROVIDERS = [
	'prisma-client-js',
	'prisma-client',
]

/**
 * Relation fields are registered as imports from a temporary `FileComponent.TEMP_PREFIX`
 * placeholder (see FileComponent#resolveImports) because at construction time a
 * FileComponent doesn't yet know the file paths of the other models it relates to.
 * This resolves those placeholders to real relative import paths once every
 * FileComponent's path is known.
 */
export const resolveRelationImports = (files: FileComponent[]): void => {
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
}

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
	useValidation: {
		desc: 'generate class-validator decorators',
		defaultValue: false,
	},
	validateNestedRelations: {
		desc: 'generate @ValidateNested()/@Type() for relation and composite-type fields (requires useValidation)',
		defaultValue: false,
	},
	useSerialization: {
		desc: "generate class-transformer's @Exclude() from a field's /// @exclude directive",
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
	preserveDecimal: {
		defaultValue: false,
		desc: 'generate Decimal fields as Prisma.Decimal instead of number',
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
		// Looks for the consuming project's own prettier config (.prettierrc,
		// prettier.config.js, "prettier" field in package.json, ...) starting from the
		// output directory and walking up — this is how generated classes end up
		// formatted with the user's own style instead of prisma-class-generator's
		// defaults. Falls back to the process's cwd (always defined) rather than
		// require.main.filename, which can be undefined depending on how the generator
		// subprocess was launched and would crash the constructor.
		this.prettierOptions =
			prettier.resolveConfig.sync(output, { useCache: false }) ||
			prettier.resolveConfig.sync(process.cwd(), { useCache: false })
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

		const clientGenerator = otherGenerators.find((g) =>
			PRISMA_CLIENT_GENERATOR_PROVIDERS.includes(g.provider.value),
		)
		if (!clientGenerator) {
			throw new GeneratorPathNotExists(
				`no prisma client generator found in schema.prisma. Add one of: ${PRISMA_CLIENT_GENERATOR_PROVIDERS.join(
					', ',
				)}`,
			)
		}

		this.rootPath = schemaPath.replace('/prisma/schema.prisma', '')
		this.clientPath = clientGenerator.output.value
	}

	async run(): Promise<void> {
		const { generator, dmmf } = this.options
		const output = parseEnvValue(generator.output!)
		const config = this.getConfig()
		this.setPrismaClientPath()

		const convertor = PrismaConvertor.getInstance()
		convertor.dmmf = dmmf
		convertor.config = config

		const classes = convertor.getClasses()
		const files = classes.map(
			(classComponent) =>
				new FileComponent({
					classComponent,
					output,
					clientImportPath: this.getClientImportPath(),
					useGraphQL: !!config.useGraphQL,
					prettierOptions: this.prettierOptions,
				}),
		)

		resolveRelationImports(files)

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

		// dryRun defaults to true, and "I ran this and nothing showed up in my output folder"
		// was a recurring first-time-setup report (see #59) — the content was printed above,
		// but easy to miss that it's a preview rather than a failure. Say so explicitly.
		if (config.dryRun) {
			log(
				[
					'',
					`This was a dry run — ${files.length} file(s) were only printed above, nothing was written to disk.`,
					'Set dryRun = "false" in your generator block once the preview looks right:',
					'',
					'  generator prismaClassGenerator {',
					'    provider = "prisma-class-generator"',
					'    dryRun   = "false"',
					'  }',
				].join('\n'),
			)
		}
		return
	}

	getConfig(): PrismaClassGeneratorConfig {
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
