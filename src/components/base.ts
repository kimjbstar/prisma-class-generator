import { PrismaDecorator } from './decorator'

export class BaseComponent {
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
