import { logger } from '@prisma/sdk'
import * as path from 'path'
import { GENERATOR_NAME } from './classes/prisma-class-generator'

export const capitalizeFirst = (src: string) => {
	return src.charAt(0).toUpperCase() + src.slice(1)
}

export const getRelativePath = (from: string, to: string): string => {
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
