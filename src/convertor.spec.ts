import { getDMMF } from '@prisma/internals'
import { DMMF } from '@prisma/generator-helper'
import { PrismaConvertor } from './convertor'

const baseSchema = (modelBlock: string) => `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

${modelBlock}
`

const getModel = async (modelBlock: string): Promise<DMMF.Model> => {
	const dmmf = await getDMMF({ datamodel: baseSchema(modelBlock) })
	return dmmf.datamodel.models[0]
}

const convert = (model: DMMF.Model) => {
	const convertor = new PrismaConvertor()
	convertor.config = {
		useSwagger: false,
		useGraphQL: false,
		useUndefinedDefault: false,
		preserveDefaultNullable: false,
		useNonNullableAssertions: false,
	}
	return convertor.getClass({ model })
}

describe('PrismaConvertor#convertField default value handling', () => {
	// regression test for #34 / #56 / #76: a numeric default like `Int @default(1)`
	// used to be misdetected as a date because the old code ran `Date.parse()` on
	// every stringified default, and `Date.parse('1')` happens to be a valid timestamp.
	it('Int @default(1)이 Date로 오탐되지 않고 숫자 리터럴로 생성된다', async () => {
		const model = await getModel(`
      model Foo {
        id    Int @id
        count Int @default(1)
      }
    `)
		const echoed = convert(model).echo()
		expect(echoed).toContain('count: number = 1')
		expect(echoed).not.toContain('new Date')
	})

	// regression test: `if (dmmfField.default)` treated falsy defaults (0, false) as "no default"
	it('Int @default(0)이 falsy라는 이유로 누락되지 않는다', async () => {
		const model = await getModel(`
      model Foo {
        id   Int @id
        zero Int @default(0)
      }
    `)
		expect(convert(model).echo()).toContain('zero: number = 0')
	})

	it('Boolean @default(false)가 falsy라는 이유로 누락되지 않는다', async () => {
		const model = await getModel(`
      model Foo {
        id   Int     @id
        flag Boolean @default(false)
      }
    `)
		expect(convert(model).echo()).toContain('flag: boolean = false')
	})

	it('String 기본값은 따옴표로 감싸진다', async () => {
		const model = await getModel(`
      model Foo {
        id   Int    @id
        name String @default("abc")
      }
    `)
		expect(convert(model).echo()).toContain("name: string = 'abc'")
	})

	it('BigInt 기본값은 BigInt(...)로 감싸진다', async () => {
		const model = await getModel(`
      model Foo {
        id     Int    @id
        amount BigInt @default(100)
      }
    `)
		expect(convert(model).echo()).toContain('amount: BigInt = BigInt(100)')
	})

	it('enum 기본값은 Enum.Member 형태로 생성된다', async () => {
		const model = await getModel(`
      enum Status {
        ACTIVE
        INACTIVE
      }
      model Foo {
        id     Int    @id
        status Status @default(ACTIVE)
      }
    `)
		expect(convert(model).echo()).toContain('status: Status = Status.ACTIVE')
	})

	it('함수 기반 기본값(now())은 리터럴을 생성하지 않는다', async () => {
		const model = await getModel(`
      model Foo {
        id        Int      @id
        createdAt DateTime @default(now())
      }
    `)
		const echoed = convert(model).echo()
		expect(echoed).toContain('createdAt: Date')
		expect(echoed).not.toMatch(/createdAt: Date\s*=/)
	})

	it('리스트 기본값은 대괄호로 감싸진다', async () => {
		const model = await getModel(`
      model Foo {
        id   Int      @id
        tags String[] @default(["a", "b"])
      }
    `)
		expect(convert(model).echo()).toContain("tags: string[] = ['a','b']")
	})
})
