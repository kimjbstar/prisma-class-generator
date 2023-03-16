"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseComponent = void 0;
class BaseComponent {
    constructor(obj) {
        this.decorators = [];
        this.echoDecorators = () => {
            const lines = this.decorators.map((decorator) => decorator.echo());
            return lines.join('\r\n');
        };
        Object.assign(this, obj);
    }
}
exports.BaseComponent = BaseComponent;
//# sourceMappingURL=base.component.js.map