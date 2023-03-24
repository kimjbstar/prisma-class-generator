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
			if (
				_field.nullable ||
				_field.relation ||
				_field.default !== undefined
			) {
				return acc
			}
			acc.push(_field)
			return acc
		}, [] as FieldComponent[])
		let constructor = ''
		if (fieldsNonNullable.length > 0) {
			let declaration = ''
			let initialization = ''
			for (const _field of fieldsNonNullable) {
				if (_field.isId) continue
				declaration += `${_field.name}?: ${_field.type}, `
				initialization += `this.${_field.name} = obj.${_field.name}
				`
			}
			constructor = `
			constructor(obj: {${declaration}}){
				${initialization}
				Object.assign(this, obj)
			}
			`
		}

		// Generate the 'static model' field
		const prismamodel_type = `Prisma.${this.name}Delegate<undefined>`
		// const prismamodel_value = `PrismaModel.prisma.${this.name.toLowerCase().substring(0,1)}${this.name.substring(1)}`;

		// Generate the 'model' getter
		const model_getter = `get model(): ${prismamodel_type} {
			return _${this.name}.model
		}`

		// Generate the fromId method
		let fromId = ''
		const fieldId = this.fields.filter((_field) => _field.isId)
		if (fieldId.length === 1) {
			// To redo completely, just a quick temp fix
			const relationFields = this.fields.reduce((acc, _field) => {
				if (_field.relation) acc.push(_field.relation.relationFromFields[0])
				return acc
			}, [] as string[])

			let fieldsDataCreate = ''
			let fieldsDataUpdate = ''
			for (const _field of this.fields) {
				if (_field.relation !== void 0) continue;
				fieldsDataUpdate += `${_field.name}: this.${_field.name},`
				if (_field.isId && !relationFields.includes(_field.name)) continue
				fieldsDataCreate += `${_field.name}: this.${_field.name},`
			}

			let checkRequired = ''
			for (const _field of fieldsNonNullable) {
				if (_field.isId) continue
				checkRequired += `this.${_field.name} === void 0
				|| `
			}
			if (checkRequired.length > 0) {
				checkRequired = checkRequired.substring(0, checkRequired.length - 3)
			} else {
				checkRequired = 'false'
			}

			fromId = IDMODEL_TEMPLATE.replaceAll(
				'#!{FIELD_NAME}',
				`${fieldId[0].name}`,)
				.replaceAll('#!{REQUIRED_FIELDS_CREATE}', fieldsDataCreate)
				.replaceAll('#!{REQUIRED_FIELDS_UPDATE}', fieldsDataUpdate)
				.replaceAll('#!{CHECK_REQUIRED}', checkRequired)
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
			// .replaceAll('#!{PRISMAMODEL_VALUE}', prismamodel_value)
			.replaceAll('#!{MODEL_GETTER}', model_getter)
		return str
	}

	reExportPrefixed = (prefix: string) => {
		return `export class _${this.name} extends ${prefix}${this.name} {}`
	}
}
