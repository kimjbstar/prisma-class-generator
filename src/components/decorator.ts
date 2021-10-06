import { Echoable } from '../interfaces/echoable'

export class PrismaDecorator implements Echoable {
	name: string
	params: any[] = []
	importFrom: string

	constructor(input: {
		name: string
		params?: any | any[]
		importFrom: string
	}) {
		const { name, params, importFrom } = input
		this.name = name
		if (params) {
			this.params = Array.isArray(params) ? params : [params]
		}
		this.importFrom = importFrom
	}

	echo() {
		const content = this.params.reduce((result, param) => {
			if (typeof param === 'object') {
				if (Object.keys(param).length > 0) {
					result.push(
						`{${Object.entries(param)
							.map(([k, v]) => `${k}: ${v}`)
							.join(', ')}}`,
					)
				}
			} else {
				result.push(param)
			}
			return result
		}, [])
		return `@${this.name}(${content.join(', ')})`
	}

	add(param: any) {
		if (this.params.includes(param)) {
			return
		}
		this.params.push(param)
	}
}

export class Decoratable {
	decorators: PrismaDecorator[] = []

	constructor(obj?: object) {
		Object.assign(this, obj)
	}

	addDecorator = (input: {
		name: string
		param: any
		importFrom: string
	}): void => {
		const { name, param, importFrom } = input
		const oldIndex = this.decorators.findIndex((v) => v.name === name)
		if (oldIndex > -1) {
			this.decorators[oldIndex].params.push({
				value: param,
			})
			return
		}
		const decorator = new PrismaDecorator({
			name: name,
			params: param,
			importFrom: importFrom,
		})
		this.decorators.push(decorator)
		return
	}

	echoDecorators = () => {
		const lines = this.decorators.map((decorator) => decorator.echo())
		return lines.join('\r\n')
	}
}
