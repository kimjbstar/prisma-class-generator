"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGenerateError = exports.GeneratorPathNotExists = exports.GeneratorFormatNotValidError = void 0;
const generator_1 = require("./generator");
const util_1 = require("./util");
class GeneratorFormatNotValidError extends Error {
    constructor(config) {
        super();
        this.config = config;
    }
}
exports.GeneratorFormatNotValidError = GeneratorFormatNotValidError;
class GeneratorPathNotExists extends Error {
}
exports.GeneratorPathNotExists = GeneratorPathNotExists;
const handleGenerateError = (e) => {
    if (e instanceof GeneratorFormatNotValidError) {
        const options = Object.keys(generator_1.PrismaClassGeneratorOptions).map((key) => {
            const value = generator_1.PrismaClassGeneratorOptions[key];
            return `\t${key} = (${value.defaultValue}) <- [${value.desc}]`;
        });
        (0, util_1.log)([
            '\nUsage : ',
            'generator prismaClassGenerator {',
            '\tprovider = "prisma-class-generator"',
            '\toutput = (string)',
            ...options,
            '}',
        ].join('\n'));
        (0, util_1.log)(`Your Input : ${JSON.stringify(e.config)}`);
        return;
    }
    if (e instanceof GeneratorPathNotExists) {
        (0, util_1.log)('path not valid in generator');
        return;
    }
    console.log('unexpected error occured');
    console.log(e);
};
exports.handleGenerateError = handleGenerateError;
//# sourceMappingURL=error-handler.js.map