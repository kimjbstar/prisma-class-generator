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
            const fieldContent = this.fields.map((_field) => _field.echo());
            let str = class_template_1.CLASS_TEMPLATE.replace('#!{DECORATORS}', this.echoDecorators())
                .replace('#!{NAME}', `${this.name}`)
                .replace('#!{FIELDS}', fieldContent.join('\r\n'))
                .replace('#!{EXTRA}', this.extra);
            return str;
        };
        this.reExportPrefixed = (prefix) => {
            return `export class ${this.name} extends ${prefix}${this.name} {}`;
        };
    }
}
exports.ClassComponent = ClassComponent;
//# sourceMappingURL=class.component.js.map