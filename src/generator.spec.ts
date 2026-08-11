import { PrismaClassGenerator } from './generator'
import { GeneratorPathNotExists } from './error-handler'

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
