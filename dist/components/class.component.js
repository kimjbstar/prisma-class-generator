"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassComponent = void 0;
const class_template_1 = require("../templates/class.template");
const base_component_1 = require("./base.component");
class ClassComponent extends base_component_1.BaseComponent {
    constructor() {
        super(...arguments);
        this.enumTypes = [];
        this.extra = '';
        this.echo = () => {
            const fieldsNonNullable = this.fields.reduce((acc, _field) => {
                if (_field.nullable)
                    return acc;
                acc.push(_field);
                return acc;
            }, []);
            let constructor = '';
            if (fieldsNonNullable.length > 0) {
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

			constructor(obj: {${declaration}}){
				Object.assign(obj)
			}
			`;
            }
            const prismamodel_type = `Prisma.${this.name}Delegate<undefined>`;
            const prismamodel_value = `PrismaModel.prisma.${this.name.toLowerCase()}`;
            const model_getter = `get model(): ${prismamodel_type} {
			return ${this.name}.model
		}`;
            const fieldContent = this.fields.map((_field) => _field.echo());
            let str = class_template_1.CLASS_TEMPLATE.replace('#!{DECORATORS}', this.echoDecorators())
                .replace('#!{NAME}', `${this.name}`)
                .replace('#!{FIELDS}', fieldContent.join('\r\n'))
                .replace('#!{EXTRA}', this.extra)
                .replace('#!{CONSTRUCTOR}', constructor)
                .replace('#!{PRISMAMODEL_TYPE}', prismamodel_type)
                .replace('#!{PRISMAMODEL_VALUE}', prismamodel_value)
                .replace('#!{MODEL_GETTER}', model_getter);
            return str;
        };
        this.reExportPrefixed = (prefix) => {
            return `export class ${this.name} extends ${prefix}${this.name} {}`;
        };
    }
}
exports.ClassComponent = ClassComponent;
//# sourceMappingURL=class.component.js.map