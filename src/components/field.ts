import { FIELD_TEMPLATE } from '../templates/field'
import { Echoable } from '../interfaces/echoable'
import { Decoratable } from '../components/decorator'

export class PrismaField extends Decoratable implements Echoable {
	name: string
	nullable: boolean
	default?: string
	type?: any

	echo = () => {
		let name = this.name
		if (this.nullable === true) {
			name += '?'
		}
		return FIELD_TEMPLATE.replace('#!{NAME}', name)
			.replace('#!{TYPE}', this.type)
			.replace('#!{DECORATORS}', this.echoDecorators())
			.replace('#!{DEFAULT}', this.default ?? 'undefined')
	}

	constructor(obj) {
		super(obj)
	}
}
