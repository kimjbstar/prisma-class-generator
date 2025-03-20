import { Dictionary } from '@prisma/internals'
import { DEFAULT_OPTIONS } from './generator'
import { log } from './util'
import { PrismaClassGeneratorOptions } from './interfaces/options'

const OPTIONS_DESCRIPTION: Record<keyof PrismaClassGeneratorOptions, string> = {
	makeIndexFile: 'make index file',
	dryRun: 'dry run',
	separateRelationFields: 'separate relation fields',
	useSwagger: 'use swagger decorstor',
	useGraphQL: 'use graphql',
	useUndefinedDefault: 'use undefined default',
	clientImportPath: 'set prisma import path instead `@prisma/client`',
	useNonNullableAssertions:
		'applies non-nullable assertions (!) to class properties',
	preserveDefaultNullable: 'preserve default nullable behavior',
	nameConvention: 'name convention for generated classes file name',
}

export class GeneratorFormatNotValidError extends Error {
	config: Dictionary<string>
	constructor(config: any) {
		super()
		this.config = config
	}
}

export class GeneratorPathNotExists extends Error {}

export const handleGenerateError = (e: Error) => {
	if (e instanceof GeneratorFormatNotValidError) {
		const options = Object.keys(DEFAULT_OPTIONS).map((key) => {
			const value = DEFAULT_OPTIONS[key]
			return `\t${key} = (${value}) <-- ${OPTIONS_DESCRIPTION[key]}`
		})
		log(
			[
				'\nUsage : ',
				'generator prismaClassGenerator {',
				'\tprovider = "prisma-class-generator"',
				'\toutput = (string)',
				...options,
				'}',
			].join('\n'),
		)
		log(`Your Input : ${JSON.stringify(e.config)}`)
		return
	}
	if (e instanceof GeneratorPathNotExists) {
		log('path not valid in generator')
		return
	}
	console.log('unexpected error occured')
	console.log(e)
}
