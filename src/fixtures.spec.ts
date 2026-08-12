import * as fs from 'fs'
import * as path from 'path'
import { getDMMF } from '@prisma/internals'
import { PrismaConvertor } from './convertor'
import { resolveRelationImports } from './generator'
import { FileComponent } from './components/file.component'

/**
 * Golden/snapshot coverage over the repo's own example schemas — one per supported
 * database (postgresql.prisma, mysql.prisma, mongodb.prisma under /prisma). Each file's
 * *entire* generated output is locked in via toMatchSnapshot(), not just fragments, so any
 * unintended change anywhere in the pipeline (convertor, components, import resolution)
 * shows up as a diff here.
 */

const FIXTURES = [
	{ name: 'postgresql', file: 'postgresql.prisma' },
	{ name: 'mysql', file: 'mysql.prisma' },
	{ name: 'mongodb', file: 'mongodb.prisma' },
	{ name: 'mssql', file: 'mssql.prisma' },
	{ name: 'sqlite', file: 'sqlite.prisma' },
	{ name: 'cockroachdb', file: 'cockroachdb.prisma' },
] as const

const generateFixture = async (fixtureFile: string) => {
	const rawDatamodel = fs.readFileSync(
		path.resolve(__dirname, '../prisma', fixtureFile),
		'utf-8',
	)
	// The checked-in fixture files keep `url = env("DATABASE_URL")` because
	// `npm run generate:*` still drives them through the pinned Prisma 6 CLI, which expects
	// it. Prisma 7's getDMMF (used here) rejects that field entirely -- it doesn't affect
	// the DMMF output either way (no live connection is made), so it's stripped only for
	// this in-process parse.
	const datamodel = rawDatamodel.replace(/^\s*url\s*=.*$\n?/m, '')
	const dmmf = await getDMMF({ datamodel })

	const convertor = new PrismaConvertor()
	convertor.dmmf = dmmf
	convertor.config = {
		useSwagger: true,
		useGraphQL: false,
		useUndefinedDefault: false,
		preserveDefaultNullable: false,
		useNonNullableAssertions: false,
		separateRelationFields: false,
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

	// sort for a stable snapshot order regardless of model declaration order
	return files
		.sort((a, b) => a.filename.localeCompare(b.filename))
		.map((f) => `// ${f.filename}\n${f.echo()}`)
		.join('\n')
}

describe.each(FIXTURES)('DB 픽스처 골든 테스트: $name', ({ file }) => {
	it(`prisma/${file}의 전체 모델이 기대한 형태로 생성된다`, async () => {
		const output = await generateFixture(file)
		expect(output).toMatchSnapshot()
	})
})
