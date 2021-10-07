import { snakeCase } from 'change-case'
import * as path from 'path'
import { Echoable } from '../interfaces/echoable'
import { PrismaClassFile } from './file'
import { Decoratable } from './decorator'
import { PrismaField } from './field'
import { CLASS_TEMPLATE } from '../templates/class'

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

	reExportPrefixed = (prefix: string) => {
		return `export class ${this.name} extends ${prefix}${this.name} {}`
	}

	toFileClass(output: string): PrismaClassFile {
		const prismaClassFile = new PrismaClassFile(this)

		prismaClassFile.dir = path.resolve(output)
		prismaClassFile.filename = `${snakeCase(this.name)}.ts`
		prismaClassFile.resolveImports()

		return prismaClassFile
	}
}
