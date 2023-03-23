"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassComponent = void 0;
const class_template_1 = require("../templates/class.template");
const idmodel_template_1 = require("../templates/idmodel.template");
const base_component_1 = require("./base.component");
class ClassComponent extends base_component_1.BaseComponent {
    constructor() {
        super(...arguments);
        this.enumTypes = [];
        this.extra = '';
        this.echo = () => {
            const fieldsNonNullable = this.fields.reduce((acc, _field) => {
                if (_field.nullable ||
                    _field.relation ||
                    _field.default !== undefined) {
                    return acc;
                }
                acc.push(_field);
                return acc;
            }, []);
            let constructor = '';
            if (fieldsNonNullable.length > 0) {
                let declaration = '';
                let initialization = '';
                for (const _field of fieldsNonNullable) {
                    if (_field.isId)
                        continue;
                    declaration += `${_field.name}?: ${_field.type}, `;
                    initialization += `this.${_field.name} = obj.${_field.name}
				`;
                }
                constructor = `
			constructor(obj: {${declaration}}){
				${initialization}
				Object.assign(this, obj)
			}
			`;
            }
            const prismamodel_type = `Prisma.${this.name}Delegate<undefined>`;
            const model_getter = `get model(): ${prismamodel_type} {
			return _${this.name}.model
		}`;
            let fromId = '';
            const fieldId = this.fields.filter((_field) => _field.isId);
            if (fieldId.length === 1) {
                let fieldsData = '';
                for (const _field of this.fields) {
                    if (_field.relation !== void 0)
                        continue;
                    fieldsData += `${_field.name}: this.${_field.name},`;
                }
                let checkRequired = '';
                for (const _field of fieldsNonNullable) {
                    if (_field.isId)
                        continue;
                    checkRequired += `this.${_field.name} === void 0
				|| `;
                }
                if (checkRequired.length > 0) {
                    checkRequired = checkRequired.substring(0, checkRequired.length - 3);
                }
                else {
                    console.log(this.name);
                    checkRequired = 'false';
                }
                fromId = idmodel_template_1.IDMODEL_TEMPLATE.replaceAll('#!{FIELD_NAME}', `${fieldId[0].name}`)
                    .replaceAll('#!{REQUIRED_FIELDS}', fieldsData)
                    .replaceAll('#!{CHECK_REQUIRED}', checkRequired);
            }
            const fieldContent = this.fields.map((_field) => _field.echo());
            let str = class_template_1.CLASS_TEMPLATE.replace('#!{DECORATORS}', this.echoDecorators())
                .replaceAll('#!{FROMID}', `${fromId}`)
                .replaceAll('#!{NAME}', `${this.name}`)
                .replaceAll('#!{FIELDS}', fieldContent.join('\r\n'))
                .replaceAll('#!{EXTRA}', this.extra)
                .replaceAll('#!{CONSTRUCTOR}', constructor)
                .replaceAll('#!{PRISMAMODEL_TYPE}', prismamodel_type)
                .replaceAll('#!{MODEL_GETTER}', model_getter);
            return str;
        };
        this.reExportPrefixed = (prefix) => {
            return `export class _${this.name} extends ${prefix}${this.name} {}`;
        };
    }
}
exports.ClassComponent = ClassComponent;
//# sourceMappingURL=class.component.js.map