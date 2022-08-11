import { FIELD_TEMPLATE } from '../templates/field.template'
import { Echoable } from '../interfaces/echoable'
import { BaseComponent } from './base.component'

export class FieldComponent extends BaseComponent implements Echoable {
	name: string
	nullable: boolean
	default?: string
	type?: string

	echo = () => {
		let name = this.name
		if (this.nullable === true) {
			name += '?'
		}
		return FIELD_TEMPLATE.replace('#!{NAME}', name)
			.replace('#!{NAME}', name)
			.replace('#!{TYPE}', this.type)
			.replace('#!{DECORATORS}', this.echoDecorators())
			.replace('#!{DEFAULT}', this.default ?? 'undefined')
	}

	constructor(obj) {
		super(obj)
	}
}
