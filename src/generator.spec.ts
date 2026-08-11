import * as os from 'os'
import { PrismaClassGenerator } from './generator'
import { GeneratorPathNotExists, GeneratorFormatNotValidError } from './error-handler'

// Constructs an instance without running the constructor (which needs a full
// GeneratorOptions + prettier config resolution) — we only need `options`
// wired up to exercise setPrismaClientPath().
const makeGenerator = (otherGenerators: unknown[]): PrismaClassGenerator => {
	const generator: PrismaClassGenerator = Object.create(
		PrismaClassGenerator.prototype,
	)
	generator.options = {
		otherGenerators,
		schemaPath: '/project/prisma/schema.prisma',
	} as PrismaClassGenerator['options']
	return generator
}

describe('PrismaClassGenerator#setPrismaClientPath', () => {
	it("레거시 'prisma-client-js' provider를 인식한다", () => {
		const generator = makeGenerator([
			{
				provider: { value: 'prisma-client-js' },
				output: { value: '/project/node_modules/@prisma/client' },
			},
		])
		generator.setPrismaClientPath()
		expect(generator.clientPath).toBe('/project/node_modules/@prisma/client')
	})

	// regression test: Prisma 7부터 기본 client 생성기 이름이 'prisma-client-js'에서
	// 'prisma-client'로 바뀌었다. 예전 코드는 'prisma-client-js'만 찾아서
	// clientGenerator가 undefined가 되고 다음 줄에서 TypeError가 터졌다.
	it("Prisma 7의 새 'prisma-client' provider를 인식한다", () => {
		const generator = makeGenerator([
			{
				provider: { value: 'prisma-client' },
				output: { value: '/project/generated/client' },
			},
		])
		generator.setPrismaClientPath()
		expect(generator.clientPath).toBe('/project/generated/client')
	})

	it('client 생성기를 찾지 못하면 원인을 알 수 있는 에러를 던진다', () => {
		const generator = makeGenerator([
			{ provider: { value: 'some-other-generator' }, output: { value: '/x' } },
		])
		expect(() => generator.setPrismaClientPath()).toThrow(
			GeneratorPathNotExists,
		)
	})
})

const makeGeneratorWithConfig = (
	config: Record<string, unknown>,
): PrismaClassGenerator => {
	const generator: PrismaClassGenerator = Object.create(
		PrismaClassGenerator.prototype,
	)
	generator.options = {
		generator: { config },
	} as unknown as PrismaClassGenerator['options']
	return generator
}

describe('PrismaClassGenerator#getClientImportPath', () => {
	it('clientImportPath 설정이 없으면 @prisma/client를 기본값으로 쓴다', () => {
		const generator = makeGeneratorWithConfig({})
		expect(generator.getClientImportPath()).toBe('@prisma/client')
	})

	it('clientImportPath가 문자열이면 그대로 쓴다', () => {
		const generator = makeGeneratorWithConfig({
			clientImportPath: '../generated/client',
		})
		expect(generator.getClientImportPath()).toBe('../generated/client')
	})

	it('clientImportPath가 배열로 오면 첫 번째 값을 쓴다', () => {
		const generator = makeGeneratorWithConfig({
			clientImportPath: ['../generated/client', 'unused'],
		})
		expect(generator.getClientImportPath()).toBe('../generated/client')
	})
})

describe('PrismaClassGenerator#getConfig', () => {
	// getConfig는 (run과 마찬가지로) 클래스 필드 화살표 함수라 프로토타입에 없다 —
	// Object.create(prototype) 우회로는 못 가져온다. 대신 생성자를 한 번 정상적으로
	// 통과시켜 실제 getConfig를 얻어두고, 테스트마다 options만 바꿔 끼운다.
	const generator = new PrismaClassGenerator({
		generator: { output: { fromEnvVar: null, value: os.tmpdir() } },
	} as unknown as ConstructorParameters<typeof PrismaClassGenerator>[0])

	it('아무 설정도 없으면 모든 옵션이 기본값으로 채워진다', () => {
		generator.options = { generator: { config: {} } } as unknown as PrismaClassGenerator['options']
		const config = generator.getConfig()
		expect(config).toMatchObject({
			makeIndexFile: true,
			dryRun: true,
			separateRelationFields: false,
			useSwagger: true,
			useGraphQL: false,
			useUndefinedDefault: false,
			useNonNullableAssertions: false,
			preserveDefaultNullable: false,
		})
	})

	// Prisma generator config 값은 스키마에서 전부 문자열로 넘어온다("true"/"false").
	it("boolean 옵션은 문자열 'true'/'false'를 실제 boolean으로 파싱한다", () => {
		generator.options = {
			generator: { config: { dryRun: 'false', useGraphQL: 'true' } },
		} as unknown as PrismaClassGenerator['options']
		const config = generator.getConfig()
		expect(config.dryRun).toBe(false)
		expect(config.useGraphQL).toBe(true)
	})

	it("boolean 옵션에 'true'/'false'가 아닌 문자열을 주면 에러를 던진다", () => {
		generator.options = {
			generator: { config: { dryRun: 'nope' } },
		} as unknown as PrismaClassGenerator['options']
		expect(() => generator.getConfig()).toThrow(GeneratorFormatNotValidError)
	})
})
