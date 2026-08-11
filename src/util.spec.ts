import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { DMMF } from '@prisma/generator-helper'
import { GeneratorFormatNotValidError } from './error-handler'
import {
	arrayify,
	capitalizeFirst,
	getRelativeTSPath,
	parseBoolean,
	parseNumber,
	prettierFormat,
	toArray,
	uniquify,
	wrapArrowFunction,
	wrapQuote,
	writeTSFile,
} from './util'

describe('capitalizeFirst', () => {
	it('첫 글자를 대문자로 바꾼다', () => {
		expect(capitalizeFirst('hello')).toBe('Hello')
	})

	it('빈 문자열은 그대로 반환한다', () => {
		expect(capitalizeFirst('')).toBe('')
	})
})

describe('arrayify', () => {
	it('타입 문자열 뒤에 []를 붙인다', () => {
		expect(arrayify('string')).toBe('string[]')
	})
})

describe('uniquify', () => {
	it('중복된 값을 원래 순서를 유지한 채 제거한다', () => {
		expect(uniquify(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b', 'c'])
	})

	it('빈 배열은 빈 배열을 반환한다', () => {
		expect(uniquify([])).toEqual([])
	})
})

describe('toArray', () => {
	it('배열이 아닌 값을 배열로 감싼다', () => {
		expect(toArray('a')).toEqual(['a'])
	})

	it('이미 배열이면 그대로 반환한다', () => {
		expect(toArray(['a', 'b'])).toEqual(['a', 'b'])
	})
})

describe('getRelativeTSPath', () => {
	it('같은 디렉토리면 ./ 접두사가 붙고 .ts 확장자가 빠진다', () => {
		expect(
			getRelativeTSPath('/output/user.ts', '/output/user_friend.ts'),
		).toBe('./user_friend')
	})

	it('다른 디렉토리면 상대 경로를 계산한다', () => {
		expect(
			getRelativeTSPath('/output/models/user.ts', '/output/index.ts'),
		).toBe('../index')
	})
})

describe('wrapArrowFunction / wrapQuote', () => {
	const stringTypeField = { type: 'Foo' } as DMMF.Field
	const nonStringTypeField = { type: { name: 'Foo' } } as unknown as DMMF.Field

	it('wrapArrowFunction은 필드 타입을 () => Type으로 감싼다', () => {
		expect(wrapArrowFunction(stringTypeField)).toBe('() => Foo')
	})

	it('wrapArrowFunction은 type이 문자열이 아니면 unknown을 쓴다', () => {
		expect(wrapArrowFunction(nonStringTypeField)).toBe('() => unknown')
	})

	it("wrapQuote는 필드 타입을 'Type'으로 감싼다", () => {
		expect(wrapQuote(stringTypeField)).toBe("'Foo'")
	})

	it("wrapQuote는 type이 문자열이 아니면 'unknown'을 쓴다", () => {
		expect(wrapQuote(nonStringTypeField)).toBe("'unknown'")
	})
})

describe('parseBoolean', () => {
	it.each([
		['true', true],
		['false', false],
		[true, true],
		[false, false],
	])('%s -> %s', (input, expected) => {
		expect(parseBoolean(input)).toBe(expected)
	})

	it('true/false가 아닌 값은 GeneratorFormatNotValidError를 던진다', () => {
		expect(() => parseBoolean('yes')).toThrow(GeneratorFormatNotValidError)
	})
})

describe('parseNumber', () => {
	it.each([
		['1', 1],
		['3.14', 3.14],
		[42, 42],
	])('%s -> %s', (input, expected) => {
		expect(parseNumber(input)).toBe(expected)
	})

	it('숫자로 변환할 수 없으면 GeneratorFormatNotValidError를 던진다', () => {
		expect(() => parseNumber('abc')).toThrow(GeneratorFormatNotValidError)
	})
})

describe('prettierFormat', () => {
	it('기본 prettier 설정으로 TypeScript 코드를 포맷한다', () => {
		const formatted = prettierFormat('const   x=1')
		expect(formatted).toBe('const x = 1;\n')
	})
})

describe('writeTSFile', () => {
	it('dryRun이면 실제 파일을 쓰지 않는다', () => {
		const target = path.join(os.tmpdir(), `prisma-class-generator-test-${Date.now()}.ts`)
		writeTSFile(target, 'export const x = 1', true)
		expect(fs.existsSync(target)).toBe(false)
	})

	it('dryRun이 아니면 디렉토리를 만들고 파일을 쓴다', () => {
		const dir = path.join(os.tmpdir(), `prisma-class-generator-test-${Date.now()}`)
		const target = path.join(dir, 'out.ts')
		writeTSFile(target, 'export const x = 1', false)
		expect(fs.readFileSync(target, 'utf-8')).toBe('export const x = 1')
		fs.rmSync(dir, { recursive: true, force: true })
	})
})
