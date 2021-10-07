import { logger } from '@prisma/sdk'
import * as path from 'path'
import * as fs from 'fs'
import { GENERATOR_NAME } from './generator'
import { GeneratorFormatNotValidError } from './error-handler'

export const capitalizeFirst = (src: string) => {
	return src.charAt(0).toUpperCase() + src.slice(1)
}

export const getRelativeTSPath = (from: string, to: string): string => {
	let rel = path
		.relative(path.resolve(path.dirname(from)), to)
		.replace('.ts', '')
	if (path.dirname(from) === path.dirname(to)) {
		rel = `./${rel}`
	}
	return rel
}

export const uniquify = (src: any[]): any[] => {
	return [...new Set(src)]
}

export const arrayify = (src: string): string => {
	return src + '[]'
}

export const wrapArrowFunction = (src: string): string => {
	return `() => ${src}`
}

export const wrapQuote = (src: string): string => {
	return `'${src}'`
}

export const log = (src: string) => {
	logger.info(`[${GENERATOR_NAME}]:${src}`)
}

export const parseBoolean = (value: unknown): boolean => {
	if (['true', 'false'].includes(value.toString()) === false) {
		throw new GeneratorFormatNotValidError('parseBoolean failed')
	}
	return value.toString() === 'true'
}

export const toArray = <T>(value: T | T[]): T[] => {
	return Array.isArray(value) ? value : [value]
}

export const writeTSFile = (
	fullPath: string,
	content: string,
	dryRun = true,
) => {
	log(`${dryRun ? '[dryRun] ' : ''}Generate ${fullPath}`)
	if (dryRun) {
		console.log(content)
		return
	}
	const dirname = path.dirname(fullPath)
	if (fs.existsSync(dirname) === false) {
		fs.mkdirSync(dirname, { recursive: true })
	}
	fs.writeFileSync(fullPath, content)
}
