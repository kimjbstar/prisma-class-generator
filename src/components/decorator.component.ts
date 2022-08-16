import { Echoable } from '../interfaces/echoable'

export class DecoratorComponent implements Echoable {
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
