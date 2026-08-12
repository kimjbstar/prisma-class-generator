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

// Split on the two casing boundaries change-case's `noCase` uses: lower/digit -> upper
// (`userId` -> `user|Id`) and upper -> upper+lower, which keeps acronyms whole
// (`HTTPRequest` -> `HTTP|Request`, not `H|T|T|P|Request`).
const SNAKE_CASE_SPLIT_PATTERNS = [/([a-z0-9])([A-Z])/g, /([A-Z])([A-Z][a-z])/g]
// everything that isn't an ASCII letter or digit is a separator, including the `_` in a name
// that is already snake_cased
const SNAKE_CASE_STRIP_PATTERN = /[^A-Z0-9]+/gi
const SNAKE_CASE_TOKEN_MARKER = '\0'

/**
 * snake_cases a Prisma model/type name for use as a generated filename and as the import path
 * other generated files reference it by — the two must agree exactly, so this has exactly one
 * definition (see FileComponent).
 *
 * This is a transcription of `change-case@4`'s `snakeCase`, which this package depended on
 * until it became the only thing standing between the build and a pure-ESM dependency. Parity
 * was verified against the real change-case@4 over 150k property-generated inputs (Prisma
 * identifiers, messy ASCII, arbitrary unicode) with zero differences, so switching to it can't
 * rename anyone's generated files.
 */
export const toSnakeCase = (value: string): string => {
	const marked = SNAKE_CASE_SPLIT_PATTERNS.reduce(
		(result, pattern) =>
			result.replace(pattern, `$1${SNAKE_CASE_TOKEN_MARKER}$2`),
		value,
	).replace(SNAKE_CASE_STRIP_PATTERN, SNAKE_CASE_TOKEN_MARKER)

	return marked
		.split(SNAKE_CASE_TOKEN_MARKER)
		.filter((token) => token.length > 0)
		.map((token) => token.toLowerCase())
		.join('_')
}

// Import specifiers must always use forward slashes -- on Windows, path.relative() returns
// `\`-separated paths, which would otherwise end up embedded verbatim in a generated
// `import ... from '..\foo'`, an invalid module specifier.
export const toImportPath = (p: string): string => p.replace(/\\/g, '/')

export const getRelativeTSPath = (from: string, to: string): string => {
	let rel = toImportPath(
		path.relative(path.resolve(path.dirname(from)), to),
	).replace('.ts', '')
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
	const stringified = String(value)
	if (['true', 'false'].includes(stringified) === false) {
		throw new GeneratorFormatNotValidError(
			`parseBoolean failed : "${value}" is not boolean type`,
		)
	}
	return stringified === 'true'
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

export const dedupePush = <T>(arr: T[], item: T): void => {
	if (arr.includes(item)) {
		return
	}
	arr.push(item)
}

/**
 * Checks a Prisma field's `///` doc comment for a `@directive` token (e.g. `/// @skip`).
 * Only triple-slash comments are visible here — DMMF drops regular `//` comments entirely,
 * so those can't be used for this.
 */
export const hasFieldDirective = (
	documentation: string | undefined,
	directive: string,
): boolean => {
	if (!documentation) {
		return false
	}
	return documentation.split(/\s+/).includes(`@${directive}`)
}

const DIRECTIVE_TOKEN_PATTERN = /^@[A-Za-z]+$/

/**
 * Strips `@directive` tokens (see hasFieldDirective) out of a field's `///` doc comment,
 * leaving the plain-text description behind for use as an OpenAPI `description`. Any
 * `@word`-shaped token is stripped, not just the directives this generator currently
 * recognizes, so adding a new directive later doesn't also require updating this filter.
 */
export const getFieldDescription = (
	documentation: string | undefined,
): string | undefined => {
	if (!documentation) {
		return undefined
	}
	const description = documentation
		.split(/\s+/)
		.filter((token) => !DIRECTIVE_TOKEN_PATTERN.test(token))
		.join(' ')
		.trim()
	return description.length > 0 ? description : undefined
}

/** Escapes a string for safe embedding inside a single-quoted TS string literal. */
export const escapeSingleQuotedString = (value: string): string => {
	return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
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

// `null` is what prettier's own resolveConfig() returns when a project has no prettier
// config at all (see PrismaClassGenerator#resolvePrettierOptions), so it's accepted here
// rather than normalized upstream -- spreading it is already a no-op.
export const prettierFormat = (
	content: string,
	options: Options | null = {},
): Promise<string> => {
	return format(content, { ...options, parser: 'typescript' })
}
