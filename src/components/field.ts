import { FIELD_TEMPLATE } from '@src/templates/field'
import { Echoable } from '@src/interfaces/echoable'
import { Decoratable } from '@src/components/decorator'

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
