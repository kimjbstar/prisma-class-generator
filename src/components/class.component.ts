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
	extra?: string = ''
	classPrefix?: string
	classPostfix?: string

	echo = () => {
		const fieldContent = this.fields.map((_field) => _field.echo())

		const classPrefix = this.classPrefix ?? ''
		const classPostfix = this.classPostfix ?? ''
		let str = CLASS_TEMPLATE.replace(
			'#!{DECORATORS}',
			this.echoDecorators(),
		)
			.replace('#!{NAME}', `${classPrefix}${this.name}${classPostfix}`)
			.replace('#!{FIELDS}', fieldContent.join('\r\n'))
			.replace('#!{EXTRA}', this.extra)

		return str
	}

	reExportPrefixed = (prefix: string) => {
		return `export class ${this.name} extends ${prefix}${this.name} {}`
	}
}
