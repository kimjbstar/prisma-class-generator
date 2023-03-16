import { Echoable } from '../interfaces/echoable'
import { FieldComponent } from './field.component'
import { CLASS_TEMPLATE } from '../templates/class.template'
import { BaseComponent } from './base.component'

export class ClassComponent extends BaseComponent implements Echoable {
	name: string
	fields?: FieldComponent[]
	relationTypes?: string[]
	enumTypes?: string[] = []
	extra?: string = ''

	echo = () => {
		// Generate the constructor foe non-noullable fields
		const fieldsNonNullable = this.fields.reduce((acc, _field) => {
			if(_field.nullable) return acc
			acc.push(_field)
			return acc;
		}, [] as FieldComponent[]);
		let constructor = ''
		if(fieldsNonNullable.length > 0){
			let declaration = '';
			let initialization = '';
			for (const _field of fieldsNonNullable) {
				declaration += `${_field.name}: ${_field.type}, `;
				initialization += `this.${_field.name} = ${_field.name};`;
			}
			constructor = 
			`
			constructor(${declaration}){
				${initialization}
			}
			`
		}

		// Generate the 'static model' field
		const prismamodel_type = `Prisma.${this.name}Delegate<undefined>`;
		const prismamodel_value = `PrismaModel.prisma.${this.name.toLowerCase()}`;

		// Generate the 'model' getter
		const model_getter = `get model(): ${prismamodel_type} {
			return ${this.name}.model
		}`;

		const fieldContent = this.fields.map((_field) => _field.echo())
		let str = CLASS_TEMPLATE.replace(
			'#!{DECORATORS}',
			this.echoDecorators(),
		)
			.replace('#!{NAME}', `${this.name}`)
			.replace('#!{FIELDS}', fieldContent.join('\r\n'))
			.replace('#!{EXTRA}', this.extra)
			.replace('#!{CONSTRUCTOR}', constructor)
			.replace('#!{PRISMAMODEL_TYPE}', prismamodel_type)
			.replace('#!{PRISMAMODEL_VALUE}', prismamodel_value)
			.replace('#!{MODEL_GETTER}', model_getter)
		return str
	}

	reExportPrefixed = (prefix: string) => {
		return `export class ${this.name} extends ${prefix}${this.name} {}`
	}
}
