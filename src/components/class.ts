import { snakeCase } from 'change-case'
import * as path from 'path'
import { Echoable } from '@src/interfaces/echoable'
import { PrismaClassFile } from '@src/components/file'
import { Decoratable } from '@src/components/decorator'
import { PrismaField } from '@src/components/field'
import { CLASS_TEMPLATE } from '@src/templates/class'

export class PrismaClass extends Decoratable implements Echoable {
	name: string
	fields?: PrismaField[]
	relationTypes?: string[]
	enumTypes?: string[]

	echo = () => {
		const fieldContent = this.fields.map((_field) => _field.echo())
		return CLASS_TEMPLATE.replace('#!{DECORATORS}', this.echoDecorators())
			.replace('#!{NAME}', `${this.name}`)
			.replace('#!{FIELDS}', fieldContent.join('\r\n'))
	}

	toFileClass(output: string): PrismaClassFile {
		const prismaClassFile = new PrismaClassFile(this)

		prismaClassFile.dir = path.resolve(output)
		prismaClassFile.filename = `${snakeCase(this.name)}.ts`
		prismaClassFile.resolveImports()

		return prismaClassFile
	}
}
