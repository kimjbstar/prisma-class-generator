import { FIELD_TEMPLATE } from '../templates/field.template'
import { Echoable } from '../interfaces/echoable'
import { BaseComponent } from './base.component'

export class FieldComponent extends BaseComponent implements Echoable {
	name: string
	nullable: boolean
	useUndefinedDefault: boolean
	default?: string
	type?: string

	echo = () => {
		let name = this.name
		if (this.nullable === true) {
			name += '?'
		}

		let defaultValue = ''
		if (this.default) {
			defaultValue = `= ${this.default}`
		} else {
			if (this.useUndefinedDefault === true) {
				defaultValue = `= undefined`
			}
		}

		return FIELD_TEMPLATE.replace('#!{NAME}', name)
			.replace('#!{NAME}', name)
			.replace('#!{TYPE}', this.type)
			.replace('#!{DECORATORS}', this.echoDecorators())
			.replace('#!{DEFAULT}', defaultValue)
	}

	constructor(obj: { name: string; useUndefinedDefault: boolean }) {
		super(obj)
	}
}
