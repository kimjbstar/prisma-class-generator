import { FIELD_TEMPLATE } from '../templates'
import { Decoratable } from './prisma-decorator'

export class PrismaField extends Decoratable {
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
