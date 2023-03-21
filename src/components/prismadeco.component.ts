import { PRISMADECO_TEMPLATE } from '../templates/prismadeco.template'
import * as path from 'path'
import { FileComponent } from './file.component'
import { ClassComponent } from './class.component'

export class PrismaDecoComponent extends FileComponent {
	classes: ClassComponent[]

	constructor(output: string) {
		super();
		this.dir = path.resolve(output)
		this.filename = "PrismaDecorators.ts"
	}

	echo = () => {
		return PRISMADECO_TEMPLATE.toString()
	}
}
