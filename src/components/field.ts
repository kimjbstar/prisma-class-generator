import { FIELD_TEMPLATE } from '../templates/field'
import { Echoable } from '../interfaces/echoable'
import { Decoratable } from '../components/decorator'

export class PrismaField extends Decoratable implements Echoable {
	name: string
	type?: any

	echo = () => {
		return FIELD_TEMPLATE.replace('#!{NAME}', this.name)
			.replace('#!{TYPE}', this.type)
			.replace('#!{DECORATORS}', this.echoDecorators())
	}

	constructor(obj) {
		super(obj)
	}
}
