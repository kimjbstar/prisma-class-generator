import { toArray } from '../util'
import { Echoable } from '../interfaces/echoable'
import { PrismaClassFile } from './file'

export class PrismaImport implements Echoable {
	from: string
	items: string[]

	constructor(from: string, items: string | string[]) {
		this.from = from
		this.items = toArray(items)
	}

	echo = () => {
		return `import { ${this.items.join(',')} } from '${this.from}'`
	}

	add(item: any) {
		if (this.items.includes(item)) {
			return
		}
		this.items.push(item)
	}

	getReplacePath(classToPath: Record<string, string>): string {
		if (this.from.includes(PrismaClassFile.TEMP_PREFIX) === false) {
			return null
		}
		const key = this.from.replace(PrismaClassFile.TEMP_PREFIX, '')
		return classToPath[key] ?? null
	}
}
