import { FIELD_TEMPLATE, FIELD_GETTER_ONE_TEMPLATE, FIELD_GETTER_MANY_TEMPLATE } from '../templates/field.template'
import { Echoable } from '../interfaces/echoable'
import { BaseComponent } from './base.component'

export class FieldComponent extends BaseComponent implements Echoable {
	name: string
	nullable: boolean
	useUndefinedDefault: boolean
	isId: boolean
	relation?: {
		hasFieldForOne?: FieldComponent,
		justLinkedToMany?: FieldComponent,
		alsoHasFieldForOne?: FieldComponent,
		relationFromFields?: string[],
		relationToFields?: string[],
		name?: string
	}
	default?: string
	type?: string

	echo = () => {
		let name = this.name
		if (this.nullable === true && !this.relation) {
			name += '?'
		}

		if(this.isId){
			this.default = '-1'
		}

		let defaultValue = ''
		if (this.default) {
			defaultValue = `= ${this.default}`
		} else {
			if (this.useUndefinedDefault === true) {
				defaultValue = `= undefined`
			}
		}

		if(!this.relation){
			return FIELD_TEMPLATE.replaceAll('#!{NAME}', name)
			.replaceAll('#!{TYPE}', this.type)
			.replaceAll('#!{DECORATORS}', this.echoDecorators())
			.replaceAll('#!{DEFAULT}', defaultValue)
		}
		else{
			if(this.relation.hasFieldForOne === this){
					return FIELD_GETTER_ONE_TEMPLATE.replaceAll('#!{NAME}', name)
				.replaceAll('#!{TYPE}', this.type)
				.replaceAll('#!{RELATION_FROM}', this.relation.relationFromFields[0])
				.replaceAll('#!{RELATION_TO}', this.relation.relationToFields[0])
			}
			else if(this.relation.alsoHasFieldForOne === this){
				return FIELD_GETTER_ONE_TEMPLATE.replaceAll('#!{NAME}', name)
				.replaceAll('#!{TYPE}', this.type)
				.replaceAll('#!{RELATION_TO}', this.relation.relationFromFields[0])
				.replaceAll('#!{RELATION_FROM}', this.relation.relationToFields[0])
			}
			else {
					return FIELD_GETTER_MANY_TEMPLATE.replaceAll('#!{NAME}', name)
				.replaceAll('#!{TYPE}', this.type)
				.replaceAll('#!{TYPE_BASE}', this.type.substring(0, this.type.length-2))
				.replaceAll('#!{RELATION_TO}', this.relation.relationFromFields[0])
				.replaceAll('#!{RELATION_FROM}', this.relation.relationToFields[0])
			}
		}

	}

	constructor(obj: { name: string; useUndefinedDefault: boolean, isId: boolean }) {
		super(obj)
	}
}
