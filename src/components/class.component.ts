import { Echoable } from '../interfaces/echoable'
import { FieldComponent } from './field.component'
import { CLASS_TEMPLATE } from '../templates/class.template'
import { DTO_CLASS_TEMPLATE } from '../templates/dto.template'
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

	// Set only on the DTO classes (see PrismaConvertor#getDtoClasses): the whole class body is
	// `extends <this expression>`, so none of the field/decorator state above applies.
	extendsExpression?: string
	// Names of *other generated* classes this class references. They're imported the same way
	// relation types are (through FileComponent.TEMP_PREFIX, resolved to a relative path once
	// every file's path is known), because a DTO doesn't know where its base class landed at
	// construction time either.
	generatedClassImports: string[] = []
	// Third-party imports the class itself needs, as opposed to ones implied by its decorators
	// -- currently just the mapped-type helpers a DTO composes with.
	externalImports: { item: string; from: string }[] = []

	constructor(obj: { name: string }) {
		super(obj)
		this.name = obj.name
	}

	echo = () => {
		if (this.extendsExpression) {
			return DTO_CLASS_TEMPLATE.replace('#!{NAME}', this.name).replace(
				'#!{EXTENDS}',
				this.extendsExpression,
			)
		}

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
