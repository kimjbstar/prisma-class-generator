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
            if (this.nullable === true || this.isId) {
                name += '?';
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
            return field_template_1.FIELD_TEMPLATE.replace('#!{NAME}', name)
                .replace('#!{NAME}', name)
                .replace('#!{TYPE}', this.type)
                .replace('#!{DECORATORS}', this.echoDecorators())
                .replace('#!{DEFAULT}', defaultValue);
        };
    }
}
exports.FieldComponent = FieldComponent;
//# sourceMappingURL=field.component.js.map