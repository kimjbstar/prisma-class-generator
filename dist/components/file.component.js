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
exports.FileComponent = void 0;
const change_case_1 = require("change-case");
const path = __importStar(require("path"));
const util_1 = require("../util");
const generator_1 = require("../generator");
const import_component_1 = require("./import.component");
class FileComponent {
    constructor(input) {
        this._imports = [];
        this.echoImports = () => {
            return this.imports
                .reduce((result, importRow) => {
                result.push(importRow.echo());
                return result;
            }, [])
                .join('\r\n');
        };
        this.echo = () => {
            return this.prismaClass
                .echo()
                .replace('#!{IMPORTS}', this.echoImports());
        };
        if (input === undefined) {
            return;
        }
        const { classComponent, output } = input;
        this._prismaClass = classComponent;
        this.dir = path.resolve(output);
        this.filename = `${(0, change_case_1.snakeCase)(classComponent.name)}.ts`;
        this.resolveImports();
    }
    get dir() {
        return this._dir;
    }
    set dir(value) {
        this._dir = value;
    }
    get filename() {
        return this._filename;
    }
    set filename(value) {
        this._filename = value;
    }
    get imports() {
        return this._imports;
    }
    set imports(value) {
        this._imports = value;
    }
    get prismaClass() {
        return this._prismaClass;
    }
    set prismaClass(value) {
        this._prismaClass = value;
    }
    registerImport(item, from) {
        const oldIndex = this.imports.findIndex((_import) => _import.from === from);
        if (oldIndex > -1) {
            this.imports[oldIndex].add(item);
            return;
        }
        this.imports.push(new import_component_1.ImportComponent(from, item));
    }
    resolveImports() {
        const generator = generator_1.PrismaClassGenerator.getInstance();
        this.prismaClass.relationTypes.forEach((relationClassName) => {
            this.registerImport(`${relationClassName}`, FileComponent.TEMP_PREFIX + relationClassName);
        });
        this.prismaClass.enumTypes.forEach((enumName) => {
            this.registerImport(enumName, generator.getClientImportPath());
        });
        this.prismaClass.decorators.forEach((decorator) => {
            this.registerImport(decorator.name, decorator.importFrom);
        });
        this.prismaClass.fields.forEach((field) => {
            field.decorators.forEach((decorator) => {
                this.registerImport(decorator.name, decorator.importFrom);
            });
        });
        if (generator.getConfig().useGraphQL) {
            this.registerImport('ID', '@nestjs/graphql');
            this.registerImport('Int', '@nestjs/graphql');
            this.registerImport('registerEnumType', '@nestjs/graphql');
            this.registerImport('GraphQLJSONObject', 'graphql-type-json');
        }
    }
    write(dryRun) {
        const generator = generator_1.PrismaClassGenerator.getInstance();
        const filePath = path.resolve(this.dir, this.filename);
        const content = (0, util_1.prettierFormat)(this.echo(), generator.prettierOptions);
        (0, util_1.writeTSFile)(filePath, content, dryRun);
    }
    getRelativePath(to) {
        return (0, util_1.getRelativeTSPath)(this.getPath(), to);
    }
    getPath() {
        return path.resolve(this.dir, this.filename);
    }
}
exports.FileComponent = FileComponent;
FileComponent.TEMP_PREFIX = '__TEMPORARY_CLASS_PATH__';
//# sourceMappingURL=file.component.js.map