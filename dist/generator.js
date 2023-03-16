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
exports.PrismaClassGenerator = exports.PrismaClassGeneratorOptions = exports.GENERATOR_NAME = void 0;
const internals_1 = require("@prisma/internals");
const path = __importStar(require("path"));
const error_handler_1 = require("./error-handler");
const convertor_1 = require("./convertor");
const util_1 = require("./util");
const index_template_1 = require("./templates/index.template");
const import_component_1 = require("./components/import.component");
const prettier = __importStar(require("prettier"));
const file_component_1 = require("./components/file.component");
const prismamodel_component_1 = require("./components/prismamodel.component");
exports.GENERATOR_NAME = 'Prisma Class Generator';
exports.PrismaClassGeneratorOptions = {
    makeIndexFile: {
        desc: 'make index file',
        defaultValue: true,
    },
    dryRun: {
        desc: 'dry run',
        defaultValue: true,
    },
    separateRelationFields: {
        desc: 'separate relation fields',
        defaultValue: false,
    },
    useSwagger: {
        desc: 'use swagger decorstor',
        defaultValue: true,
    },
    useGraphQL: {
        desc: 'use graphql',
        defaultValue: false,
    },
    useUndefinedDefault: {
        desc: 'use undefined default',
        defaultValue: false,
    },
};
class PrismaClassGenerator {
    constructor(options) {
        this.run = async () => {
            const { generator, dmmf } = this.options;
            const output = (0, internals_1.parseEnvValue)(generator.output);
            const config = this.getConfig();
            this.setPrismaClientPath();
            const convertor = convertor_1.PrismaConvertor.getInstance();
            convertor.dmmf = dmmf;
            convertor.config = config;
            const classes = convertor.getClasses();
            const files = classes.map((classComponent) => new file_component_1.FileComponent({ classComponent, output }));
            const classToPath = files.reduce((result, fileRow) => {
                const fullPath = path.resolve(fileRow.dir, fileRow.filename);
                result[fileRow.prismaClass.name] = fullPath;
                return result;
            }, {});
            files.forEach((fileRow) => {
                fileRow.imports = fileRow.imports.map((importRow) => {
                    const pathToReplace = importRow.getReplacePath(classToPath);
                    if (pathToReplace !== null) {
                        importRow.from = fileRow.getRelativePath(pathToReplace);
                    }
                    return importRow;
                });
            });
            files.push(new prismamodel_component_1.PrismaModelComponent(output));
            files.forEach((fileRow) => {
                fileRow.write(config.dryRun);
            });
            if (config.makeIndexFile) {
                const indexFilePath = path.resolve(output, 'index.ts');
                const imports = files.map((fileRow) => new import_component_1.ImportComponent((0, util_1.getRelativeTSPath)(indexFilePath, fileRow.getPath()), fileRow.prismaClass.name));
                const content = index_template_1.INDEX_TEMPLATE.replace('#!{IMPORTS}', imports.map((i) => i.echo('_')).join('\r\n'))
                    .replace('#!{RE_EXPORT_CLASSES}', files
                    .map((f) => `	${f.prismaClass.reExportPrefixed('_')}`)
                    .join('\r\n'))
                    .replace('#!{CLASSES}', files.map((f) => f.prismaClass.name).join(', '));
                const formattedContent = (0, util_1.prettierFormat)(content, this.prettierOptions);
                (0, util_1.writeTSFile)(indexFilePath, formattedContent, config.dryRun);
            }
            return;
        };
        this.getConfig = () => {
            const config = this.options.generator.config;
            const result = {};
            for (const optionName in exports.PrismaClassGeneratorOptions) {
                const { defaultValue } = exports.PrismaClassGeneratorOptions[optionName];
                result[optionName] = defaultValue;
                const value = config[optionName];
                if (value) {
                    if (typeof defaultValue === 'boolean') {
                        result[optionName] = (0, util_1.parseBoolean)(value);
                    }
                    else if (typeof defaultValue === 'number') {
                        result[optionName] = (0, util_1.parseNumber)(value);
                    }
                    else {
                        result[optionName] = value;
                    }
                }
            }
            return result;
        };
        if (options) {
            this.options = options;
        }
        const output = (0, internals_1.parseEnvValue)(options.generator.output);
        this.prettierOptions =
            prettier.resolveConfig.sync(output, { useCache: false }) ||
                prettier.resolveConfig.sync(path.dirname(require.main.filename), {
                    useCache: false,
                });
    }
    get options() {
        return this._options;
    }
    set options(value) {
        this._options = value;
    }
    get prettierOptions() {
        return this._prettierOptions;
    }
    set prettierOptions(value) {
        this._prettierOptions = value;
    }
    static getInstance(options) {
        if (PrismaClassGenerator.instance) {
            return PrismaClassGenerator.instance;
        }
        PrismaClassGenerator.instance = new PrismaClassGenerator(options);
        return PrismaClassGenerator.instance;
    }
    getClientImportPath() {
        if (!this.rootPath || !this.clientPath) {
            throw new error_handler_1.GeneratorPathNotExists();
        }
        let finalPath = path.relative(this.rootPath, this.clientPath);
        if (finalPath.includes('@prisma'))
            finalPath = finalPath.substring(finalPath.indexOf('@prisma'));
        return finalPath.replace('node_modules/', '');
    }
    setPrismaClientPath() {
        var _a;
        const { otherGenerators, schemaPath } = this.options;
        this.rootPath = schemaPath.replace('/prisma/schema.prisma', '');
        const defaultPath = path.resolve(this.rootPath, 'node_modules/@prisma/client');
        const clientGenerator = otherGenerators.find((g) => g.provider.value === 'prisma-client-js');
        this.clientPath = (_a = clientGenerator === null || clientGenerator === void 0 ? void 0 : clientGenerator.output.value) !== null && _a !== void 0 ? _a : defaultPath;
    }
}
exports.PrismaClassGenerator = PrismaClassGenerator;
//# sourceMappingURL=generator.js.map