"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldComponent = void 0;
const field_template_1 = require("../templates/field.template");
const base_component_1 = require("./base.component");
class FieldComponent extends base_component_1.BaseComponent {
    constructor(obj) {
        super(obj);
        this.echo = () => {
            let name = this.name;
            if (this.nullable === true && !this.relation) {
                name += '?';
            }
            if (this.isId) {
                this.default = '-1';
            }
            let defaultValue = '';
            if (this.default) {
                defaultValue = `= ${this.default}`;
            }
            else {
                if (this.useUndefinedDefault === true) {
                    defaultValue = `= undefined`;
                }
            }
            if (!this.relation) {
                return field_template_1.FIELD_TEMPLATE.replaceAll('#!{NAME}', name)
                    .replaceAll('#!{TYPE}', this.type)
                    .replaceAll('#!{DECORATORS}', this.echoDecorators())
                    .replaceAll('#!{DEFAULT}', defaultValue);
            }
            else {
                if (this.relation.hasFieldForOne === this) {
                    return field_template_1.FIELD_GETTER_ONE_TEMPLATE.replaceAll('#!{NAME}', name)
                        .replaceAll('#!{TYPE}', this.type)
                        .replaceAll('#!{RELATION_FROM}', this.relation.relationFromFields[0])
                        .replaceAll('#!{RELATION_TO}', this.relation.relationToFields[0]);
                }
                else {
                    return field_template_1.FIELD_GETTER_MANY_TEMPLATE.replaceAll('#!{NAME}', name)
                        .replaceAll('#!{TYPE}', this.type)
                        .replaceAll('#!{TYPE_BASE}', this.type.substring(0, this.type.length - 2))
                        .replaceAll('#!{RELATION_TO}', this.relation.relationFromFields[0])
                        .replaceAll('#!{RELATION_FROM}', this.relation.relationToFields[0]);
                }
            }
        };
    }
}
exports.FieldComponent = FieldComponent;
//# sourceMappingURL=field.component.js.map