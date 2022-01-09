import { Dictionary } from '@prisma/sdk'
import { log } from './util'

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
		log('Usage Example')
		log(`
generator prismaClassGenerator {
	provider	= "prisma-class-generator"
	output		= (string)
	dryRun   	= (boolean)
	useSwagger	= (boolean)
	seperateRelationFields = (boolean),
}`)
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
