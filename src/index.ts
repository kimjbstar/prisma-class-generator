import { generatorHandler, GeneratorOptions } from '@prisma/generator-helper'
import {
	GENERATOR_NAME,
	PrismaClassGenerator,
} from './classes/prisma-class-generator'
import { log } from './util'
import { handleGenerateError } from './error-handler'

generatorHandler({
	onManifest: () => ({
		defaultOutput: '../src/_gen/prisma-class',
		prettyName: GENERATOR_NAME,
	}),
	onGenerate: async (options: GeneratorOptions) => {
		try {
			await PrismaClassGenerator.getInstance().run(options)
		} catch (e) {
			handleGenerateError(e)
			return
		}
	},
})

log('Handler Registered.')
