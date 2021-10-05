import { PrismaClassFile } from './prisma-class-file'

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

	getReplacePath(classToPath: Record<string, string>): string {
		if (this.from.includes(PrismaClassFile.TEMP_PREFIX) === false) {
			return null
		}
		const key = this.from.replace(PrismaClassFile.TEMP_PREFIX, '')
		return classToPath[key] ?? null
	}

	constructor(from: string, items: string | string[]) {
		this.from = from
		this.items = Array.isArray(items) ? items : [items]
	}
}
