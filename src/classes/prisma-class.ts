import { snakeCase } from 'change-case'
import * as path from 'path'
import { CLASS_TEMPLATE } from '../templates'
import { PrismaClassFile } from './prisma-class-file'
import { Decoratable } from './prisma-decorator'
import { PrismaField } from './prisma-field'

export class PrismaClass extends Decoratable {
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
		return prismaClassFile
	}
}
