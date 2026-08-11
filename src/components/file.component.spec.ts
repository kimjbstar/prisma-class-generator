import { getDMMF } from '@prisma/internals'
import { PrismaConvertor } from '../convertor'
import { PrismaClassGeneratorConfig, resolveRelationImports } from '../generator'
import { FileComponent } from './file.component'

const baseSchema = (modelBlock: string, provider: 'postgresql' | 'mongodb' = 'postgresql') => `
datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
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

const findImportFrom = (file: FileComponent, item: string): string | undefined =>
	file.imports.find((i) => i.items.includes(item))?.from

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

		const userFriendFile = files.find((f) => f.prismaClass.name === 'UserFriend')
		const userFile = files.find((f) => f.prismaClass.name === 'User')

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

		const authorFile = files.find((f) => f.prismaClass.name === 'Author')
		const bookFile = files.find((f) => f.prismaClass.name === 'Book')

		expect(findImportFrom(authorFile, 'Book')).toBe('./book')
		expect(findImportFrom(bookFile, 'Author')).toBe('./author')
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

		const relationsFile = files.find(
			(f) => f.prismaClass.name === 'CategoryRelations',
		)
		const baseFile = files.find((f) => f.prismaClass.name === 'Category')

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

		const dealerFile = files.find((f) => f.prismaClass.name === 'Dealer')
		const addressFile = files.find(
			(f) => f.prismaClass.name === 'ShippingAddress',
		)

		expect(addressFile.filename).toBe('shipping_address.ts')
		expect(findImportFrom(dealerFile, 'ShippingAddress')).toBe(
			'./shipping_address',
		)
	})
})
