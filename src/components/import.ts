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

	echo = (alias?: string) => {
		let content: string[] = this.items
		if (alias) {
			content = content.map((item) => `${item} as ${alias}${item}`)
		}
		return `import { ${content.join(', ')} } from "${this.from?.toString().replace(/\\/g, "/")}";`
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
