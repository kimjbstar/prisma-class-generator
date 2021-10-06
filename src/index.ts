import { generatorHandler, GeneratorOptions } from '@prisma/generator-helper'
import { GENERATOR_NAME, PrismaClassGenerator } from '@src/generator'
import { log } from '@src/util'
import { handleGenerateError } from '@src/error-handler'

generatorHandler({
	onManifest: () => ({
		defaultOutput: '../src/_gen/prisma-class',
		prettyName: GENERATOR_NAME,
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
