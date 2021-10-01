export class PrismaDecorator {
	name: string
	params: any[] = []

	echo() {
		const content = this.params.reduce((result, param) => {
			if (typeof param === 'object') {
				result.push(
					`{${Object.entries(param)
						.map(([k, v]) => `${k}:${v}`)
						.join(',')}}`,
				)
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

	constructor(name: string, params?: any | any[]) {
		this.name = name
		if (params) {
			this.params = Array.isArray(params) ? params : [params]
		}
	}
}

export class Decoratable {
	decorators: PrismaDecorator[] = []

	constructor(obj?: object) {
		Object.assign(this, obj)
	}

	addDecorator = (input: { name: string; param: any }): void => {
		const { name, param } = input
		const oldIndex = this.decorators.findIndex((v) => v.name === name)
		if (oldIndex > -1) {
			this.decorators[oldIndex].params.push({
				value: param,
			})
			return
		}
		const decorator = new PrismaDecorator(name, param)
		this.decorators.push(decorator)
		return
	}

	echoDecorators = () => {
		const lines = this.decorators.map((decorator) => decorator.echo())
		return lines.join('\r\n')
	}
}
