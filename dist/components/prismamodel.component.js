"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaModelComponent = void 0;
const prismamodel_template_1 = require("../templates/prismamodel.template");
const path = __importStar(require("path"));
const file_component_1 = require("./file.component");
class PrismaModelComponent extends file_component_1.FileComponent {
    constructor(output, classes) {
        super();
        this.echo = () => {
            let classesImports = '';
            let classesInit = '';
            for (const classComp of this.classes) {
                classesImports += `import { ${classComp.name} } from './${classComp.name.toLowerCase()}'
			`;
                classesInit += `${classComp.name}.model = PrismaModel.prisma.${classComp.name.toLowerCase().substring(0, 1)}${classComp.name.substring(1)};
			`;
            }
            return prismamodel_template_1.PRISMAMODEL_TEMPLATE.replaceAll('!#{CLASSES_IMPORTS}', classesImports).replaceAll('!#{CLASSES_INIT}', classesInit);
        };
        this.dir = path.resolve(output);
        this.filename = "PrismaModel.ts";
        this.classes = classes;
    }
}
exports.PrismaModelComponent = PrismaModelComponent;
//# sourceMappingURL=prismamodel.component.js.map