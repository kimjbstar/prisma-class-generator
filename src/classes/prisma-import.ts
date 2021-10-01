import { pascalCase } from 'change-case'
import { CLASS_TEMPLATE, FIELD_TEMPLATE } from '../templates'
import { Decoratable } from './prisma-decorator'

export class PrismaImport {
	from: string
	items: string[]

	echo = () => {
		return `import { ${this.items.join(',')} } from '${this.from}'`
	}

	add(item: any) {
		if (this.items.includes(item)) {
			return
		}
		this.items.push(item)
	}

	constructor(from: string, items: string | string[]) {
		this.from = from
		this.items = Array.isArray(items) ? items : [items]
	}
}
