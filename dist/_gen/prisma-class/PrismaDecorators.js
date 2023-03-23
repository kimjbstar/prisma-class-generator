"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaDecorators = void 0;
require("reflect-metadata");
class PrismaDecorators {
    static required(value, context) {
        if (context.kind === 'field') {
            console.log(`${String(context.name)}: ${value}`);
        }
        return void 0;
    }
    static loggedMethod(target, context) {
        const methodName = String(context.name);
        function replacementMethod(...args) {
            console.log(`LOG: Entering method '${methodName}'.`);
            const result = target.call(this, ...args);
            console.log(`LOG: Exiting method '${methodName}'.`);
            return result;
        }
        return replacementMethod;
    }
}
exports.PrismaDecorators = PrismaDecorators;
//# sourceMappingURL=PrismaDecorators.js.map