import { logger } from '@prisma/internals'
import * as path from 'path'
import * as fs from 'fs'
import { GENERATOR_NAME } from './generator'
import { GeneratorFormatNotValidError } from './error-handler'
import { DMMF } from '@prisma/generator-helper'
import { Options, format } from 'prettier'

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

export const uniquify = <T>(src: T[]): T[] => {
	return [...new Set(src)]
}

export const arrayify = (src: string): string => {
	return src + '[]'
}

export const wrapArrowFunction = (field: DMMF.Field): string => {
	if (typeof field.type !== 'string') {
		return `() => unknown`
	}
	return `() => ${field.type}`
}

export const wrapQuote = (field: DMMF.Field): string => {
	if (typeof field.type !== 'string') {
		return `'unknown'`
	}
	return `'${field.type}'`
}

export const log = (src: string) => {
	logger.info(`[${GENERATOR_NAME}]:${src}`)
}

export const parseBoolean = (value: unknown): boolean => {
	if (['true', 'false'].includes(value.toString()) === false) {
		throw new GeneratorFormatNotValidError(
			`parseBoolean failed : "${value}" is not boolean type`,
		)
	}
	return value.toString() === 'true'
}

export const parseNumber = (value: unknown): number => {
	const numbered = Number(value)
	if (Number.isNaN(numbered)) {
		throw new GeneratorFormatNotValidError(
			`parseNumber failed : "${value}" is not number type`,
		)
	}
	return numbered
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

export const prettierFormat = (content: string, options: Options = {}) => {
	return format(content, { ...options, parser: 'typescript' })
}
