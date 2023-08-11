"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INDEX_TEMPLATE = void 0;
exports.INDEX_TEMPLATE = `#!{IMPORTS}

export namespace PrismaModel {
#!{RE_EXPORT_CLASSES}

	export const extraModels = [
		#!{CLASSES}
	]
}`;
//# sourceMappingURL=index.template.js.map