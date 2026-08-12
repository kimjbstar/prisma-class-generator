import { Echoable } from '../interfaces/echoable'
import { FieldComponent } from './field.component'
import { CLASS_TEMPLATE } from '../templates/class.template'
import { BaseComponent } from './base.component'

export class ClassComponent extends BaseComponent implements Echoable {
	name: string
	// filled in by PrismaConvertor#getClass right after construction, which is also why these
	// start empty rather than being constructor params -- the convertor needs the instance
	// before it can work out its fields and related type names.
	fields: FieldComponent[] = []
	relationTypes: string[] = []
	enumTypes: string[] = []
	extra = ''
	types?: string[]

	constructor(obj: { name: string }) {
		super(obj)
		this.name = obj.name
	}

	echo = () => {
		const fieldContent = this.fields.map((_field) => _field.echo())
		const str = CLASS_TEMPLATE.replace(
			'#!{DECORATORS}',
			this.echoDecorators(),
		)
			.replace('#!{NAME}', `${this.name}`)
			.replace('#!{FIELDS}', fieldContent.join('\r\n'))
			.replace('#!{EXTRA}', this.extra)

		return str
	}

	reExportPrefixed = (prefix: string) => {
		return `export class ${this.name} extends ${prefix}${this.name} {}`
	}
}
