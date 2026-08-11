import { generatorHandler, GeneratorOptions } from '@prisma/generator-helper'
import { GENERATOR_NAME, PrismaClassGenerator } from './generator'
import { log } from './util'
import { handleGenerateError } from './error-handler'

generatorHandler({
	onManifest: () => ({
		defaultOutput: '../src/_gen/prisma-class',
		prettyName: GENERATOR_NAME,
		// NOTE: intentionally not using `requiresGenerators` here — Prisma checks it with AND
		// semantics, so listing both 'prisma-client-js' and 'prisma-client' (Prisma 7's renamed
		// client generator) would wrongly require both to be present. See generator.ts,
		// setPrismaClientPath() for the actual (either/or) check with a clearer error message.
	}),
	onGenerate: async (options: GeneratorOptions) => {
		try {
			await PrismaClassGenerator.getInstance(options).run()
		} catch (e) {
			handleGenerateError(e)
			return
		}
	},
})

log('Handler Registered.')
