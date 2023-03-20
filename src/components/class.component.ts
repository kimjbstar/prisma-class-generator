import { Echoable } from '../interfaces/echoable'
import { FieldComponent } from './field.component'
import { CLASS_TEMPLATE } from '../templates/class.template'
import { IDMODEL_TEMPLATE } from '../templates/idmodel.template'
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
			if(_field.nullable || _field.relation) return acc
			acc.push(_field)
			return acc;
		}, [] as FieldComponent[]);
		let constructor = ''
		if(fieldsNonNullable.length > 0){
			let declaration = '';
			for (const _field of fieldsNonNullable) {
				if(_field.isId) continue
				declaration += `${_field.name}: ${_field.type}, `;
			}
			constructor = 
			`
			constructor(obj: {${declaration}}){
				Object.assign(this, obj)
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

		// Generate the fromId method
		let fromId = '';
		const fieldId = this.fields.filter((_field) => _field.isId)
		if(fieldId.length === 1){
			fromId = IDMODEL_TEMPLATE.replace(
				'#!{FIELD_NAME}',
				fieldId[0].name
			)
		}
		
		const fieldContent = this.fields.map((_field) => _field.echo())
		let str = CLASS_TEMPLATE.replace(
			'#!{DECORATORS}',
			this.echoDecorators(),
		)
			.replaceAll('#!{FROMID}', `${fromId}`)
			.replaceAll('#!{NAME}', `${this.name}`)
			.replaceAll('#!{FIELDS}', fieldContent.join('\r\n'))
			.replaceAll('#!{EXTRA}', this.extra)
			.replaceAll('#!{CONSTRUCTOR}', constructor)
			.replaceAll('#!{PRISMAMODEL_TYPE}', prismamodel_type)
			.replaceAll('#!{PRISMAMODEL_VALUE}', prismamodel_value)
			.replaceAll('#!{MODEL_GETTER}', model_getter)
		return str
	}

	reExportPrefixed = (prefix: string) => {
		return `export class ${this.name} extends ${prefix}${this.name} {}`
	}
}
