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
exports.PrismaDecoComponent = void 0;
const prismadeco_template_1 = require("../templates/prismadeco.template");
const path = __importStar(require("path"));
const file_component_1 = require("./file.component");
class PrismaDecoComponent extends file_component_1.FileComponent {
    constructor(output) {
        super();
        this.echo = () => {
            return prismadeco_template_1.PRISMADECO_TEMPLATE.toString();
        };
        this.dir = path.resolve(output);
        this.filename = "PrismaDecorators.ts";
    }
}
exports.PrismaDecoComponent = PrismaDecoComponent;
//# sourceMappingURL=prismadeco.component.js.map