import { getDMMF } from '@prisma/internals'
import { DMMF } from '@prisma/generator-helper'
import { PrismaConvertor } from './convertor'
import { PrismaClassGeneratorConfig } from './generator'

type SupportedProvider = 'postgresql' | 'mysql' | 'mongodb'

const baseSchema = (modelBlock: string, provider: SupportedProvider = 'postgresql') => `
datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}

${modelBlock}
`

const getModel = async (
	modelBlock: string,
	provider: SupportedProvider = 'postgresql',
): Promise<DMMF.Model> => {
	const dmmf = await getDMMF({ datamodel: baseSchema(modelBlock, provider) })
	return dmmf.datamodel.models[0]
}

const defaultConfig: PrismaClassGeneratorConfig = {
	useSwagger: false,
	useGraphQL: false,
	useUndefinedDefault: false,
	preserveDefaultNullable: false,
	useNonNullableAssertions: false,
}

const convert = (
	model: DMMF.Model,
	config: Partial<PrismaClassGeneratorConfig> = {},
) => {
	const convertor = new PrismaConvertor()
	convertor.config = { ...defaultConfig, ...config }
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

describe('PrismaConvertor#convertField 기본 타입 매핑 (모든 DefaultPrismaFieldType, 단일값/리스트)', () => {
	// prisma 스칼라 타입 -> 생성되는 TS 타입 매핑표. Postgres/MySQL/MongoDB 어디서든
	// 스칼라 타입 이름 자체는 DMMF 레벨에서 동일하게 취급되므로, provider 하나로도
	// 매핑 로직 자체를 충분히 검증할 수 있다 (DB별 실제 스키마 차이는 fixtures.spec.ts에서 커버).
	const typeMap: Array<[prismaType: string, tsType: string]> = [
		['BigInt', 'BigInt'],
		['Boolean', 'boolean'],
		['Bytes', 'Buffer'],
		['DateTime', 'Date'],
		['Decimal', 'number'],
		['Float', 'number'],
		['Int', 'number'],
		['Json', 'object'],
		['String', 'string'],
	]

	it.each(typeMap)('%s -> %s (단일 값)', async (prismaType, tsType) => {
		const model = await getModel(`
      model Foo {
        id    Int @id
        value ${prismaType}
      }
    `)
		expect(convert(model).echo()).toContain(`value: ${tsType}`)
	})

	it.each(typeMap)('%s[] -> %s[] (리스트)', async (prismaType, tsType) => {
		const model = await getModel(`
      model Foo {
        id    Int @id
        value ${prismaType}[]
      }
    `)
		expect(convert(model).echo()).toContain(`value: ${tsType}[]`)
	})
})

describe('PrismaConvertor#extractSwaggerDecoratorFromField', () => {
	it('필수 필드는 @ApiProperty를 사용한다', async () => {
		const model = await getModel(`
      model Foo {
        id    Int @id
        value String
      }
    `)
		const echoed = convert(model, { useSwagger: true }).echo()
		expect(echoed).toContain("@ApiProperty({type: String})")
	})

	it('nullable 필드는 @ApiPropertyOptional을 사용한다', async () => {
		const model = await getModel(`
      model Foo {
        id    Int     @id
        value String?
      }
    `)
		const echoed = convert(model, { useSwagger: true }).echo()
		expect(echoed).toContain('@ApiPropertyOptional({type: String})')
	})

	it('리스트 필드는 isArray: true를 포함한다', async () => {
		const model = await getModel(`
      model Foo {
        id    Int      @id
        value String[]
      }
    `)
		const echoed = convert(model, { useSwagger: true }).echo()
		expect(echoed).toContain('isArray: true')
	})

	it('relation 필드는 화살표 함수 타입으로 감싸진다', async () => {
		// getModel()은 첫 번째 모델(Bar)을 돌려준다 — Bar.foo가 relation 필드다.
		const barModel = await getModel(`
      model Bar {
        id    Int @id
        fooId Int @unique
        foo   Foo @relation(fields: [fooId], references: [id])
      }
      model Foo {
        id  Int   @id
        bar Bar?
      }
    `)
		const echoed = convert(barModel, { useSwagger: true }).echo()
		expect(echoed).toContain('type: () => Foo')
	})

	// regression test for #60 (see file.component.spec.ts for the reproduction/rationale):
	// a relation field's *type annotation* must be the `...AsType` alias, not the plain
	// class name, so it resolves to a `type`-only import with no runtime footprint.
	it('relation 필드의 타입 annotation은 AsType 접미사가 붙은 alias를 쓴다', async () => {
		const barModel = await getModel(`
      model Bar {
        id    Int @id
        fooId Int @unique
        foo   Foo @relation(fields: [fooId], references: [id])
      }
      model Foo {
        id  Int   @id
        bar Bar?
      }
    `)
		const echoed = convert(barModel).echo()
		expect(echoed).toContain('foo: FooAsType')
	})

	it('enum 필드는 enum/enumName 옵션을 포함한다', async () => {
		const model = await getModel(`
      enum Status {
        ACTIVE
        INACTIVE
      }
      model Foo {
        id     Int    @id
        status Status
      }
    `)
		const echoed = convert(model, { useSwagger: true }).echo()
		expect(echoed).toContain("enum: Status, enumName: 'Status'")
	})

	// regression test: MongoDB composite `type` 필드(relation도 enum도 아닌, 임베드된
	// 객체)는 relation과 마찬가지로 다른 생성 클래스를 가리키는데, type 옵션 없이
	// @ApiProperty()만 나가고 있었다 — Swagger가 리플렉션만으로는 이 타입을 알 수 없다.
	it('MongoDB composite type 필드는 relation처럼 화살표 함수 타입으로 감싸진다', async () => {
		const model = await getModel(
			`
      model Dealer {
        id      String  @id @default(auto()) @map("_id") @db.ObjectId
        address Address
      }
      type Address {
        city String
      }
    `,
			'mongodb',
		)
		const echoed = convert(model, { useSwagger: true }).echo()
		expect(echoed).toContain('type: () => Address')
	})

	it('MongoDB composite type 리스트 필드는 isArray와 화살표 함수 타입을 함께 받는다', async () => {
		const model = await getModel(
			`
      model Dealer {
        id        String    @id @default(auto()) @map("_id") @db.ObjectId
        addresses Address[]
      }
      type Address {
        city String
      }
    `,
			'mongodb',
		)
		const echoed = convert(model, { useSwagger: true }).echo()
		expect(echoed).toContain('isArray: true, type: () => Address')
	})
})

describe('PrismaConvertor#extractTypeGraphQLDecoratorFromField', () => {
	it('id 필드는 (type) => ID를 사용한다', async () => {
		const model = await getModel(`
      model Foo {
        id Int @id
      }
    `)
		const echoed = convert(model, { useGraphQL: true }).echo()
		expect(echoed).toContain('@Field((type) => ID)')
	})

	it('숫자 필드는 (type) => Int로 매핑된다', async () => {
		const model = await getModel(`
      model Foo {
        id    Int @id
        value Int
      }
    `)
		const echoed = convert(model, { useGraphQL: true }).echo()
		expect(echoed).toContain('@Field((type) => Int)')
	})

	// regression test: Int/Float/Decimal all map to the TS type 'number', but the old code
	// collapsed all of them to GraphQL Int — a Float/Decimal field with a fractional value
	// would fail GraphQL's own runtime validation for Int.
	it('Float/Decimal 필드는 (type) => Int가 아니라 (type) => Float로 매핑된다', async () => {
		const model = await getModel(`
      model Foo {
        id    Int     @id
        price Float
        amt   Decimal
      }
    `)
		const echoed = convert(model, { useGraphQL: true }).echo()
		expect(echoed.match(/@Field\(\(type\) => Float\)/g)).toHaveLength(2)
		expect(echoed).not.toContain('@Field((type) => Int)')
	})

	it('Json 필드는 GraphQLJSONObject로 매핑된다', async () => {
		const model = await getModel(`
      model Foo {
        id    Int  @id
        value Json
      }
    `)
		const echoed = convert(model, { useGraphQL: true }).echo()
		expect(echoed).toContain('@Field((type) => GraphQLJSONObject)')
	})

	it('리스트 필드는 [Type] 형태로 감싸진다', async () => {
		const model = await getModel(`
      model Foo {
        id    Int      @id
        value String[]
      }
    `)
		const echoed = convert(model, { useGraphQL: true }).echo()
		expect(echoed).toContain('@Field((type) => [String])')
	})

	it('nullable 필드는 {nullable: true} 옵션이 붙는다', async () => {
		const model = await getModel(`
      model Foo {
        id    Int     @id
        value String?
      }
    `)
		const echoed = convert(model, { useGraphQL: true }).echo()
		expect(echoed).toContain('{nullable : true}')
	})

	// regression test: swagger와 같은 이유로 graphql @Field도 composite type을
	// (type) => X 없이 내보내고 있었다 — nestjs/graphql은 이 정보 없이는
	// "Cannot determine a GraphQL output type" 런타임 에러를 낸다.
	it('MongoDB composite type 필드는 relation처럼 (type) => X로 감싸진다', async () => {
		const model = await getModel(
			`
      model Dealer {
        id      String  @id @default(auto()) @map("_id") @db.ObjectId
        address Address
      }
      type Address {
        city String
      }
    `,
			'mongodb',
		)
		const echoed = convert(model, { useGraphQL: true }).echo()
		expect(echoed).toContain('@Field((type) => Address)')
	})

	it('MongoDB composite type 리스트 필드는 (type) => [X]로 감싸진다', async () => {
		const model = await getModel(
			`
      model Dealer {
        id        String    @id @default(auto()) @map("_id") @db.ObjectId
        addresses Address[]
      }
      type Address {
        city String
      }
    `,
			'mongodb',
		)
		const echoed = convert(model, { useGraphQL: true }).echo()
		expect(echoed).toContain('@Field((type) => [Address])')
	})
})

describe('PrismaConvertor#convertField 설정 플래그', () => {
	it('useNonNullableAssertions가 켜지면 이름 뒤에 !가 붙는다', async () => {
		const model = await getModel(`
      model Foo {
        id    Int    @id
        value String
      }
    `)
		const echoed = convert(model, { useNonNullableAssertions: true }).echo()
		expect(echoed).toContain('value!: string')
	})

	it('preserveDefaultNullable이 켜지면 nullable 필드가 ?  대신 | null을 쓴다', async () => {
		const model = await getModel(`
      model Foo {
        id    Int     @id
        value String?
      }
    `)
		const echoed = convert(model, { preserveDefaultNullable: true }).echo()
		expect(echoed).toContain('value: string | null')
	})

	it('useUndefinedDefault가 켜지면 기본값 없는 필드에 = undefined가 붙는다', async () => {
		const model = await getModel(`
      model Foo {
        id    Int    @id
        value String
      }
    `)
		const echoed = convert(model, { useUndefinedDefault: true }).echo()
		expect(echoed).toContain('value: string = undefined')
	})

	it('preserveDecimal이 켜지면 Decimal 필드가 Prisma.Decimal 타입으로 생성된다', async () => {
		const model = await getModel(`
      model Foo {
        id  Int     @id
        amt Decimal
      }
    `)
		const withoutOption = convert(model).echo()
		expect(withoutOption).toContain('amt: number')

		const withOption = convert(model, { preserveDecimal: true }).echo()
		expect(withOption).toContain('amt: Prisma.Decimal')
	})

	it('preserveDecimal이 켜져도 swagger 데코레이터의 type은 그대로 Number다', async () => {
		const model = await getModel(`
      model Foo {
        id  Int     @id
        amt Decimal
      }
    `)
		const echoed = convert(model, {
			useSwagger: true,
			preserveDecimal: true,
		}).echo()
		expect(echoed).toContain('type: Number')
		expect(echoed).toContain('amt: Prisma.Decimal')
	})
})

// regression tests for #72: `/// @skip` excludes a field from the generated class entirely.
describe('PrismaConvertor#getClass — /// @skip 필드 디렉티브', () => {
	it('@skip이 붙은 필드는 생성된 클래스에서 완전히 빠진다', async () => {
		const model = await getModel(`
      model Foo {
        id Int @id
        /// @skip
        createdAt DateTime @default(now())
        name String
      }
    `)
		const echoed = convert(model).echo()
		expect(echoed).not.toContain('createdAt')
		expect(echoed).toContain('name: string')
	})

	it('일반 // 주석은 @skip으로 인식되지 않는다', async () => {
		const model = await getModel(`
      model Foo {
        id Int @id
        // @skip (regular comment, not a doc comment — DMMF never sees this)
        createdAt DateTime @default(now())
      }
    `)
		const echoed = convert(model).echo()
		expect(echoed).toContain('createdAt: Date')
	})

	it('@skip된 relation 필드는 import도 함께 빠진다', async () => {
		const barModel = await getModel(`
      model Bar {
        id    Int @id
        fooId Int @unique
        /// @skip
        foo   Foo @relation(fields: [fooId], references: [id])
      }
      model Foo {
        id  Int   @id
        bar Bar?
      }
    `)
		const barClass = convert(barModel)
		expect(barClass.relationTypes).toEqual([])
		expect(barClass.echo()).not.toContain('foo:')
	})
})

// regression tests for #39: `/// @ApiHideProperty` hides a field from Swagger docs without
// removing it from the class.
describe('PrismaConvertor#convertField — /// @ApiHideProperty 필드 디렉티브', () => {
	it('@ApiHideProperty가 붙은 필드는 @ApiHideProperty() 데코레이터가 추가된다', async () => {
		const model = await getModel(`
      model Foo {
        id Int @id
        /// @ApiHideProperty
        passwordHash String
      }
    `)
		const echoed = convert(model, { useSwagger: true }).echo()
		expect(echoed).toContain('@ApiHideProperty()')
		expect(echoed).toContain('passwordHash: string')
	})

	it('useSwagger가 꺼져 있으면 @ApiHideProperty 디렉티브가 있어도 데코레이터를 추가하지 않는다', async () => {
		const model = await getModel(`
      model Foo {
        id Int @id
        /// @ApiHideProperty
        passwordHash String
      }
    `)
		const echoed = convert(model, { useSwagger: false }).echo()
		expect(echoed).not.toContain('ApiHideProperty')
	})
})
