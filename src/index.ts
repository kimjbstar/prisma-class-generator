import { generatorHandler, GeneratorOptions } from '@prisma/generator-helper'
import { PrismaClassGenerator } from './classes/prisma-class-generator'
import { Dictionary } from '@prisma/generator-helper'
import { logger } from '@prisma/sdk'

export class GeneratorFormatNotValidError extends Error {
	config: Dictionary<string>
	constructor(config: any) {
		super()
		this.config = config
	}
}

export const handleGenerateError = (e: Error) => {
	if (e instanceof GeneratorFormatNotValidError) {
		logger.info('Usage Example')
		logger.info(`
generator prismaClassGenerator {
	provider	= "prisma-class-generator"
	output		= (string)
	dryRun   	= (boolean)
	useSwagger	= (boolean)
}`)
		logger.info(`Your Input : ${JSON.stringify(e.config)}`)
		return
	}
	logger.error('unexpected error occured')
	logger.error(e)
}

generatorHandler({
	onManifest: () => ({
		defaultOutput: '../src/_gen/prisma-class',
		prettyName: 'Prisma Class Generator',
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
