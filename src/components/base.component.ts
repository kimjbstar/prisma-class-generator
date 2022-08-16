import { DecoratorComponent } from './decorator.component'

export class BaseComponent {
	decorators: DecoratorComponent[] = []

	constructor(obj?: object) {
		Object.assign(this, obj)
	}

	echoDecorators = () => {
		const lines = this.decorators.map((decorator) => decorator.echo())
		return lines.join('\r\n')
	}
}
