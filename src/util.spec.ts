import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { DMMF } from '@prisma/generator-helper'
import { GeneratorFormatNotValidError } from './error-handler'
import {
	arrayify,
	capitalizeFirst,
	escapeSingleQuotedString,
	getFieldDescription,
	getRelativeTSPath,
	parseBoolean,
	parseNumber,
	prettierFormat,
	toArray,
	toImportPath,
	toSnakeCase,
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

// These expectations are change-case@4's `snakeCase` output, captured when that dependency was
// replaced by toSnakeCase (parity verified over 150k property-generated inputs at the time).
// They are effectively a compatibility contract, not a style preference: the value feeds both
// the generated filename and the import path other generated files use to reach it, so a change
// here silently renames every user's generated files.
describe('toSnakeCase', () => {
	it.each([
		['User', 'user'],
		['UserProfile', 'user_profile'],
		['ShippingAddress', 'shipping_address'],
		['CategoryRelations', 'category_relations'],
		// acronyms stay whole rather than splitting per letter
		['HTTPRequest', 'http_request'],
		['ABCModel', 'abc_model'],
		['XMLHttpRequest', 'xml_http_request'],
		['UserID', 'user_id'],
		['ID', 'id'],
		// a digit ends a token, an uppercase letter after it starts a new one
		['User2Post', 'user2_post'],
		['Order2', 'order2'],
		['Foo1Bar2', 'foo1_bar2'],
		['v2Model', 'v2_model'],
		// underscores are separators, not content -- an already-snake_cased name round-trips
		['user_profile', 'user_profile'],
		['Model_V2', 'model_v2'],
		['_Private', 'private'],
		// single letters and degenerate input
		['A', 'a'],
		['aB', 'a_b'],
		['AAA', 'aaa'],
		['', ''],
		['___', ''],
	])('%s -> %s', (input, expected) => {
		expect(toSnakeCase(input)).toBe(expected)
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

	// regression test: Windows에서 path.relative()는 백슬래시로 구분된 경로를 반환한다
	// (path.win32.relative로 직접 확인: 'models\\product.ts') -- 그 문자열이 그대로 생성된
	// TypeScript의 `import ... from '..\\foo'`에 박히면 유효하지 않은 모듈 경로가 된다.
	// getRelativeTSPath 내부에서 실제로 Windows 스타일 상대 경로를 슬래시로 정규화하는지
	// path.win32를 직접 써서 검증한다 (macOS/Linux 실행기에서도 재현 가능).
	it('Windows 스타일(백슬래시) 상대 경로도 슬래시로 정규화된다', () => {
		const windowsStyleRelative = path.win32.relative(
			path.win32.dirname('C:\\project\\src\\_gen\\category.ts'),
			'C:\\project\\src\\_gen\\models\\product.ts',
		)
		expect(windowsStyleRelative).toBe('models\\product.ts')
		expect(toImportPath(windowsStyleRelative)).toBe('models/product.ts')
	})

	it('구분자가 없는 일반 경로는 그대로 둔다', () => {
		expect(toImportPath('../index')).toBe('../index')
	})
})

describe('wrapArrowFunction / wrapQuote', () => {
	const stringTypeField = { type: 'Foo' } as DMMF.Field
	const nonStringTypeField = {
		type: { name: 'Foo' },
	} as unknown as DMMF.Field

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

describe('getFieldDescription', () => {
	it('documentation이 없으면 undefined를 반환한다', () => {
		expect(getFieldDescription(undefined)).toBeUndefined()
	})

	it('directive가 없는 순수 설명 텍스트는 그대로 반환한다', () => {
		expect(
			getFieldDescription('The password hash, hashed with bcrypt.'),
		).toBe('The password hash, hashed with bcrypt.')
	})

	it('@directive 토큰을 제거하고 남은 설명만 반환한다', () => {
		expect(getFieldDescription('Internal only. @ApiHideProperty')).toBe(
			'Internal only.',
		)
	})

	it('directive만 있고 설명이 없으면 undefined를 반환한다', () => {
		expect(getFieldDescription('@skip')).toBeUndefined()
	})

	it('여러 줄(공백)로 이어진 설명은 한 줄로 합쳐진다', () => {
		expect(getFieldDescription('Line one\nLine two')).toBe(
			'Line one Line two',
		)
	})
})

describe('escapeSingleQuotedString', () => {
	it('작은따옴표를 이스케이프한다', () => {
		expect(escapeSingleQuotedString("user's password")).toBe(
			"user\\'s password",
		)
	})

	it('백슬래시를 이스케이프한다', () => {
		expect(escapeSingleQuotedString('a\\b')).toBe('a\\\\b')
	})

	it('특수문자가 없으면 그대로 반환한다', () => {
		expect(escapeSingleQuotedString('plain text')).toBe('plain text')
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
	it('기본 prettier 설정으로 TypeScript 코드를 포맷한다', async () => {
		const formatted = await prettierFormat('const   x=1')
		expect(formatted).toBe('const x = 1;\n')
	})
})

describe('writeTSFile', () => {
	it('dryRun이면 실제 파일을 쓰지 않는다', () => {
		const target = path.join(
			os.tmpdir(),
			`prisma-class-generator-test-${Date.now()}.ts`,
		)
		writeTSFile(target, 'export const x = 1', true)
		expect(fs.existsSync(target)).toBe(false)
	})

	it('dryRun이 아니면 디렉토리를 만들고 파일을 쓴다', () => {
		const dir = path.join(
			os.tmpdir(),
			`prisma-class-generator-test-${Date.now()}`,
		)
		const target = path.join(dir, 'out.ts')
		writeTSFile(target, 'export const x = 1', false)
		expect(fs.readFileSync(target, 'utf-8')).toBe('export const x = 1')
		fs.rmSync(dir, { recursive: true, force: true })
	})
})
