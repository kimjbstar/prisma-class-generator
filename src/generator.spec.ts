import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
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
	it('아무 설정도 없으면 모든 옵션이 기본값으로 채워진다', () => {
		const generator = makeGeneratorWithConfig({})
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
		const generator = makeGeneratorWithConfig({
			dryRun: 'false',
			useGraphQL: 'true',
		})
		const config = generator.getConfig()
		expect(config.dryRun).toBe(false)
		expect(config.useGraphQL).toBe(true)
	})

	it("boolean 옵션에 'true'/'false'가 아닌 문자열을 주면 에러를 던진다", () => {
		const generator = makeGeneratorWithConfig({ dryRun: 'nope' })
		expect(() => generator.getConfig()).toThrow(GeneratorFormatNotValidError)
	})
})

describe('PrismaClassGenerator 생성자 — 사용자 prettier 설정 감지', () => {
	// README에 문서화된 동작: "생성된 클래스는 (있다면) 사용자의 prettier 설정 파일을
	// 사용해 포맷된다." output 디렉토리부터 상위로 올라가며 .prettierrc 등을 찾는다.
	it('output 디렉토리 상위에 있는 .prettierrc를 찾아서 적용한다', () => {
		const projectDir = fs.mkdtempSync(
			path.join(os.tmpdir(), 'pcg-prettier-test-'),
		)
		const outputDir = path.join(projectDir, 'src', '_gen', 'prisma-class')
		fs.writeFileSync(
			path.join(projectDir, '.prettierrc.json'),
			JSON.stringify({ semi: false, singleQuote: true }),
		)

		const generator = new PrismaClassGenerator({
			generator: { output: { fromEnvVar: null, value: outputDir } },
		} as unknown as ConstructorParameters<typeof PrismaClassGenerator>[0])

		expect(generator.prettierOptions).toMatchObject({
			semi: false,
			singleQuote: true,
		})

		fs.rmSync(projectDir, { recursive: true, force: true })
	})

	// regression test: output 디렉토리는 첫 실행 시 아직 존재하지 않는 게 일반적이다
	// (dryRun이 아니고서야 이 시점엔 아직 안 만들어져 있음) — 존재하지 않는 경로를
	// 줘도 상위 디렉토리 탐색이 정상 동작해야 한다.
	it('output 디렉토리가 아직 생성되지 않았어도 상위의 prettier 설정을 찾는다', () => {
		const projectDir = fs.mkdtempSync(
			path.join(os.tmpdir(), 'pcg-prettier-test-'),
		)
		fs.writeFileSync(
			path.join(projectDir, '.prettierrc.json'),
			JSON.stringify({ semi: false }),
		)
		const notYetCreatedOutputDir = path.join(
			projectDir,
			'src',
			'_gen',
			'prisma-class',
		)

		const generator = new PrismaClassGenerator({
			generator: {
				output: { fromEnvVar: null, value: notYetCreatedOutputDir },
			},
		} as unknown as ConstructorParameters<typeof PrismaClassGenerator>[0])

		expect(generator.prettierOptions).toMatchObject({ semi: false })

		fs.rmSync(projectDir, { recursive: true, force: true })
	})

	// regression test: 예전 코드는 fallback으로 require.main.filename을 읽었는데,
	// 실행 방식에 따라 require.main이 undefined일 수 있어 생성자가 그냥 죽을 수
	// 있었다. 지금은 process.cwd()로 대체했고, 설정이 전혀 없어도 크래시 없이
	// null을 반환해야 한다.
	it('prettier 설정이 어디에도 없어도 생성자가 죽지 않는다', () => {
		const projectDir = fs.mkdtempSync(
			path.join(os.tmpdir(), 'pcg-prettier-test-'),
		)
		const outputDir = path.join(projectDir, 'out')

		expect(() => {
			new PrismaClassGenerator({
				generator: { output: { fromEnvVar: null, value: outputDir } },
			} as unknown as ConstructorParameters<typeof PrismaClassGenerator>[0])
		}).not.toThrow()

		fs.rmSync(projectDir, { recursive: true, force: true })
	})
})
