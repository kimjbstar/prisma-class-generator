import { snakeCase } from 'change-case'
import * as path from 'path'
import { Echoable } from '../interfaces/echoable'
import { FileComponent } from './file.component'
import { FieldComponent } from './field.component'
import { CLASS_TEMPLATE } from '../templates/class.template'
import { BaseComponent } from './base.component'

export class ClassComponent extends BaseComponent implements Echoable {
	name: string
	fields?: FieldComponent[]
	relationTypes?: string[]
	enumTypes?: string[] = []

	echo = () => {
		// console.log(this.enumTypes)
		const fieldContent = this.fields.map((_field) => _field.echo())
		let str = CLASS_TEMPLATE.replace(
			'#!{DECORATORS}',
			this.echoDecorators(),
		)
			.replace('#!{NAME}', `${this.name}`)
			.replace('#!{FIELDS}', fieldContent.join('\r\n'))

		if (this.enumTypes.length > 0) {
			for (const enumType of this.enumTypes) {
				str += `registerEnumType(${enumType}, {
	name: "${enumType}",
});
`
			}
		}

		return str
	}

	reExportPrefixed = (prefix: string) => {
		return `export class ${this.name} extends ${prefix}${this.name} {}`
	}
}
