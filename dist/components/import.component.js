"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportComponent = void 0;
const util_1 = require("../util");
const file_component_1 = require("./file.component");
class ImportComponent {
    constructor(from, items) {
        this.echo = (alias) => {
            let content = this.items;
            if (alias) {
                content = content.map((item) => `${item} as ${alias}${item}`);
            }
            return `import { ${content.join(',')} } from '${this.from}'`;
        };
        this.from = from;
        this.items = (0, util_1.toArray)(items);
    }
    add(item) {
        if (this.items.includes(item)) {
            return;
        }
        this.items.push(item);
    }
    getReplacePath(classToPath) {
        var _a;
        if (this.from.includes(file_component_1.FileComponent.TEMP_PREFIX) === false) {
            return null;
        }
        const key = this.from.replace(file_component_1.FileComponent.TEMP_PREFIX, '');
        return (_a = classToPath[key]) !== null && _a !== void 0 ? _a : null;
    }
}
exports.ImportComponent = ImportComponent;
//# sourceMappingURL=import.component.js.map