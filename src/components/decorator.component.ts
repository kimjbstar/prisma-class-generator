import { Echoable } from '../interfaces/echoable'
import { dedupePush } from '../util'

// A decorator argument is either a ready-to-interpolate code fragment (a raw string like
// `(type) => ID`, or a number/boolean literal) or a plain options object that echo() below
// renders as `{k: v, ...}` via Object.entries (e.g. `{ each: true }`, or the full
// SwaggerDecoratorParams bag) -- `object` rather than `Record<string, unknown>` on purpose,
// since the latter demands an index signature that a concrete interface like
// SwaggerDecoratorParams doesn't (and shouldn't) declare.
export type DecoratorParam = string | number | boolean | object

export class DecoratorComponent implements Echoable {
	name: string
	params: DecoratorParam[] = []
	importFrom: string

	constructor(input: {
		name: string
		params?: DecoratorParam | DecoratorParam[]
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
		const content = this.params.reduce<string[]>((result, param) => {
			if (typeof param === 'object') {
				if (Object.keys(param).length > 0) {
					result.push(
						`{${Object.entries(param)
							.map(([k, v]) => `${k}: ${v}`)
							.join(', ')}}`,
					)
				}
			} else {
				result.push(`${param}`)
			}
			return result
		}, [])
		return `@${this.name}(${content.join(', ')})`
	}

	add(param: DecoratorParam) {
		dedupePush(this.params, param)
	}
}
