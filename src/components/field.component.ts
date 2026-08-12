import { FIELD_TEMPLATE } from '../templates/field.template'
import { Echoable } from '../interfaces/echoable'
import { BaseComponent } from './base.component'

export class FieldComponent extends BaseComponent implements Echoable {
	name: string
	useUndefinedDefault: boolean
	// only ever switched on by PrismaConvertor#convertField, so "off" is the real default --
	// echo() below already treats an unset flag exactly like `false`.
	nonNullableAssertion = false
	preserveDefaultNullable = false
	nullable = false
	default?: string
	type?: string

	echo = () => {
		let name = this.name
		let type = this.type
		if (this.nullable === true) {
			if (this.preserveDefaultNullable) {
				type = this.type + ' | null'
			} else {
				name += '?'
			}
		} else if (this.nonNullableAssertion === true) {
			name += '!'
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
			.replace('#!{TYPE}', type ?? '')
			.replace('#!{DECORATORS}', this.echoDecorators())
			.replace('#!{DEFAULT}', defaultValue)
	}

	constructor(obj: { name: string; useUndefinedDefault: boolean }) {
		super(obj)
		this.name = obj.name
		this.useUndefinedDefault = obj.useUndefinedDefault
	}
}
