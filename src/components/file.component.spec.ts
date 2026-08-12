import { getDMMF } from '@prisma/internals'
import { PrismaConvertor } from '../convertor'
import {
	PrismaClassGeneratorConfig,
	resolveRelationImports,
} from '../generator'
import { FileComponent } from './file.component'
import { ImportComponent } from './import.component'

const baseSchema = (
	modelBlock: string,
	provider: 'postgresql' | 'mongodb' = 'postgresql',
) => `
datasource db {
  provider = "${provider}"
}

${modelBlock}
`

const buildFiles = async (
	modelBlock: string,
	config: Partial<PrismaClassGeneratorConfig> = {},
	provider: 'postgresql' | 'mongodb' = 'postgresql',
): Promise<FileComponent[]> => {
	const dmmf = await getDMMF({ datamodel: baseSchema(modelBlock, provider) })
	const convertor = new PrismaConvertor()
	convertor.dmmf = dmmf
	convertor.config = {
		useSwagger: false,
		useGraphQL: false,
		useUndefinedDefault: false,
		preserveDefaultNullable: false,
		useNonNullableAssertions: false,
		separateRelationFields: false,
		...config,
	}
	const classes = convertor.getClasses()
	const files = classes.map(
		(classComponent) =>
			new FileComponent({
				classComponent,
				output: '/output',
				clientImportPath: '@prisma/client',
				useGraphQL: false,
				prettierOptions: {},
			}),
	)
	resolveRelationImports(files)
	return files
}

// throwing (rather than returning undefined and letting the assertion below blow up on a
// property access) keeps a broken lookup reported as "no generated file for class X" instead
// of "cannot read properties of undefined".
const findFile = (files: FileComponent[], className: string): FileComponent => {
	const file = files.find((f) => f.prismaClass.name === className)
	if (!file) {
		throw new Error(`no generated file for class "${className}"`)
	}
	return file
}

const findImport = (file: FileComponent, from: string): ImportComponent => {
	const importRow = file.imports.find((i) => i.from === from)
	if (!importRow) {
		throw new Error(`${file.filename} has no import from "${from}"`)
	}
	return importRow
}

const findImportFrom = (
	file: FileComponent,
	item: string,
): string | undefined => file.imports.find((i) => i.items.includes(item))?.from

describe('relation import 경로 해석 (FileComponent + resolveRelationImports)', () => {
	// regression test for #57 / #73: 생성된 파일명(snake_case)과 다른 클래스가
	// 그 클래스를 import할 때 쓰는 경로가 서로 어긋나던 문제.
	it('모델명이 여러 단어여도 파일명과 relation import 경로가 snake_case로 일치한다', async () => {
		const files = await buildFiles(`
      model UserFriend {
        id     Int  @id
        userId Int
        user   User @relation(fields: [userId], references: [id])
      }

      model User {
        id      Int          @id
        friends UserFriend[]
      }
    `)

		const userFriendFile = findFile(files, 'UserFriend')
		const userFile = findFile(files, 'User')

		expect(userFriendFile.filename).toBe('user_friend.ts')
		expect(userFile.filename).toBe('user.ts')
		// User가 UserFriend[]를 relation으로 갖고 있으니, 실제 생성 파일명(user_friend.ts)과
		// 정확히 같은 경로를 import해야 한다.
		expect(findImportFrom(userFile, 'UserFriend')).toBe('./user_friend')
	})

	// regression test for the import-resolution class of bug behind #60: 두 모델이
	// 서로를 참조하면 양쪽 파일 모두 상대방을 올바른 경로로 import해야 한다.
	it('두 모델이 서로를 참조해도(순환) 양쪽 다 올바른 경로로 import된다', async () => {
		const files = await buildFiles(`
      model Author {
        id    Int    @id
        books Book[]
      }

      model Book {
        id       Int    @id
        authorId Int
        author   Author @relation(fields: [authorId], references: [id])
      }
    `)

		const authorFile = findFile(files, 'Author')
		const bookFile = findFile(files, 'Book')

		expect(findImportFrom(authorFile, 'Book')).toBe('./book')
		expect(findImportFrom(bookFile, 'Author')).toBe('./author')
	})

	// regression test for #60: reproduced with real tsc + emitDecoratorMetadata + native
	// ESM output — TypeScript emits an eager `__metadata("design:type", Book)` runtime
	// reference for a property typed `book: Book`, and under ESM's live-binding circular
	// import semantics that throws "Cannot access 'Book' before initialization" before both
	// classes finish initializing. A `type`-only import has no runtime value, so TS can't
	// emit a reference to it (falls back to `Object`) — no crash. Every relation field's type
	// annotation must use the `type ... as ...AsType` alias, not the plain value import.
	it('relation import는 design:type 메타데이터로 인한 순환 참조 크래시를 피하려고 type-only alias를 함께 등록한다', async () => {
		const files = await buildFiles(`
      model Author {
        id    Int    @id
        books Book[]
      }

      model Book {
        id       Int    @id
        authorId Int
        author   Author @relation(fields: [authorId], references: [id])
      }
    `)

		const authorFile = findFile(files, 'Author')
		const bookFile = findFile(files, 'Book')

		const bookImport = findImport(authorFile, './book')
		expect(bookImport.items).toContain('Book')
		expect(bookImport.items).toContain('type Book as BookAsType')

		const authorImport = findImport(bookFile, './author')
		expect(authorImport.items).toContain('Author')
		expect(authorImport.items).toContain('type Author as AuthorAsType')
	})

	// regression test for #35: separateRelationFields + self-relation 조합에서
	// *Relations 클래스가 자기 자신의 base 클래스를 import해야 한다.
	it('separateRelationFields + self-relation에서 Relations 클래스가 base 클래스를 import한다', async () => {
		const files = await buildFiles(
			`
        model Category {
          id       Int        @id
          parentId Int?
          parent   Category?  @relation("CategoryToCategory", fields: [parentId], references: [id])
          children Category[] @relation("CategoryToCategory")
        }
      `,
			{ separateRelationFields: true },
		)

		const relationsFile = findFile(files, 'CategoryRelations')
		const baseFile = findFile(files, 'Category')

		expect(relationsFile.filename).toBe('category_relations.ts')
		expect(baseFile.filename).toBe('category.ts')
		expect(findImportFrom(relationsFile, 'Category')).toBe('./category')
	})

	// regression test found while writing this suite: MongoDB composite `type` blocks
	// (mongodb.prisma의 Address 같은) were imported via `type.toLowerCase()` while the
	// file was actually named via snake_case — for a single word like "Address" both
	// happen to produce the same string, which is why this went unnoticed, but a
	// multi-word type name like "ShippingAddress" produced './shippingaddress' while
	// the file written to disk was 'shipping_address.ts' — a guaranteed "module not
	// found" for every MongoDB user with a multi-word composite type name.
	it('여러 단어로 된 MongoDB composite type(예: ShippingAddress)도 파일명과 import 경로가 일치한다', async () => {
		const files = await buildFiles(
			`
      model Dealer {
        id      String          @id @default(auto()) @map("_id") @db.ObjectId
        address ShippingAddress
      }

      type ShippingAddress {
        city String
      }
    `,
			{},
			'mongodb',
		)

		const dealerFile = findFile(files, 'Dealer')
		const addressFile = findFile(files, 'ShippingAddress')

		expect(addressFile.filename).toBe('shipping_address.ts')
		expect(findImportFrom(dealerFile, 'ShippingAddress')).toBe(
			'./shipping_address',
		)
	})
})

describe('preserveDecimal — Prisma 네임스페이스 import', () => {
	it('preserveDecimal 필드가 있으면 clientImportPath에서 Prisma를 import한다', async () => {
		const files = await buildFiles(
			`
      model Foo {
        id  Int     @id
        amt Decimal
      }
    `,
			{ preserveDecimal: true },
		)
		const fooFile = findFile(files, 'Foo')
		expect(findImportFrom(fooFile, 'Prisma')).toBe('@prisma/client')
	})

	it('preserveDecimal이 꺼져 있으면 Prisma를 import하지 않는다', async () => {
		const files = await buildFiles(`
      model Foo {
        id  Int     @id
        amt Decimal
      }
    `)
		const fooFile = findFile(files, 'Foo')
		expect(findImportFrom(fooFile, 'Prisma')).toBeUndefined()
	})
})

describe('useValidation — class-validator import', () => {
	it('useValidation이 켜지면 class-validator에서 필요한 validator만 import한다', async () => {
		const files = await buildFiles(
			`
      model Foo {
        id    Int    @id
        name  String
      }
    `,
			{ useValidation: true },
		)
		const fooFile = findFile(files, 'Foo')
		const validatorImport = findImport(fooFile, 'class-validator')
		expect(validatorImport.items).toContain('IsInt')
		expect(validatorImport.items).toContain('IsString')
	})

	it('useValidation이 꺼져 있으면 class-validator를 import하지 않는다', async () => {
		const files = await buildFiles(`
      model Foo {
        id   Int    @id
        name String
      }
    `)
		const fooFile = findFile(files, 'Foo')
		expect(findImportFrom(fooFile, 'IsInt')).toBeUndefined()
		expect(fooFile.imports.some((i) => i.from === 'class-validator')).toBe(
			false,
		)
	})
})

describe('makeDtoFiles — DTO 파일의 import 경로 해석', () => {
	const DTO_SCHEMA = `
      model Post {
        id       Int    @id @default(autoincrement())
        title    String
        authorId String
        author   Author @relation(fields: [authorId], references: [id])
      }

      model Author {
        id    String @id
        posts Post[]
      }
    `

	// DTO는 자기 base 클래스를 값으로(extends 절에서) 참조하므로, relation 필드와 달리
	// type-only alias로는 대체할 수 없다. 그래서 값 import 하나만 등록돼야 한다.
	it('Create DTO는 base 클래스를 실제 생성 파일명 경로로 값 import한다', async () => {
		const files = await buildFiles(DTO_SCHEMA, { makeDtoFiles: true })

		const createPost = findFile(files, 'CreatePost')
		expect(createPost.filename).toBe('create_post.ts')

		const baseImport = findImport(createPost, './post')
		expect(baseImport.items).toEqual(['Post'])
		// 이 스펙의 buildFiles는 useSwagger: false가 기본이라 mapped type이
		// @nestjs/mapped-types에서 온다 (출처 분기 자체는 convertor.spec.ts가 검증).
		expect(findImportFrom(createPost, 'OmitType')).toBe(
			'@nestjs/mapped-types',
		)
	})

	it('Update DTO는 모델이 아니라 Create DTO를 import한다', async () => {
		const files = await buildFiles(DTO_SCHEMA, { makeDtoFiles: true })

		const updatePost = findFile(files, 'UpdatePost')
		expect(updatePost.filename).toBe('update_post.ts')
		expect(findImport(updatePost, './create_post').items).toEqual([
			'CreatePost',
		])
		expect(findImportFrom(updatePost, 'PartialType')).toBe(
			'@nestjs/mapped-types',
		)
	})

	// DTO에는 필드가 하나도 없으니 GraphQL 헬퍼(ID/Int/registerEnumType/GraphQLJSONObject)를
	// 참조할 곳도 없다 -- 넣으면 100% 미사용 import가 된다.
	it('useGraphQL이 켜져 있어도 DTO 파일에는 GraphQL import를 넣지 않는다', async () => {
		const files = await buildFiles(DTO_SCHEMA, {
			makeDtoFiles: true,
			useGraphQL: true,
		})

		const createPost = findFile(files, 'CreatePost')
		expect(
			createPost.imports.some((i) => i.from === '@nestjs/graphql'),
		).toBe(false)
		// 반면 모델 클래스에는 그대로 들어간다
		expect(
			findFile(files, 'Post').imports.some(
				(i) => i.from === '@nestjs/graphql',
			),
		).toBe(true)
	})
})
