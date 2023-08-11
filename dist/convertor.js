"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaConvertor = void 0;
const class_component_1 = require("./components/class.component");
const decorator_component_1 = require("./components/decorator.component");
const field_component_1 = require("./components/field.component");
const util_1 = require("./util");
const primitiveMapType = {
    Int: 'number',
    String: 'string',
    DateTime: 'Date',
    Boolean: 'boolean',
    Json: 'object',
    BigInt: 'BigInt',
    Float: 'number',
    Decimal: 'number',
    Bytes: 'Buffer',
};
class PrismaConvertor {
    constructor() {
        this.getPrimitiveMapTypeFromDMMF = (dmmfField) => {
            if (typeof dmmfField.type !== 'string') {
                return 'unknown';
            }
            return primitiveMapType[dmmfField.type];
        };
        this.extractTypeGraphQLDecoratorFromField = (dmmfField) => {
            const options = {};
            const decorator = new decorator_component_1.DecoratorComponent({
                name: 'Field',
                importFrom: '@nestjs/graphql',
            });
            if (dmmfField.isId) {
                decorator.params.push(`(type) => ID`);
                return decorator;
            }
            const isJson = dmmfField.type === 'Json';
            if (isJson) {
                decorator.params.push(`(type) => GraphQLJSONObject`);
            }
            let type = this.getPrimitiveMapTypeFromDMMF(dmmfField);
            if (type && type !== 'any' && !isJson) {
                let grahQLType = (0, util_1.capitalizeFirst)(type);
                if (grahQLType === 'Number') {
                    grahQLType = 'Int';
                }
                if (dmmfField.isList) {
                    grahQLType = `[${grahQLType}]`;
                }
                decorator.params.push(`(type) => ${grahQLType}`);
            }
            if (dmmfField.relationName) {
                let type = dmmfField.type;
                if (dmmfField.isList) {
                    type = `[${type}]`;
                }
                decorator.params.push(`(type) => ${type}`);
            }
            if (dmmfField.kind === 'enum') {
                let type = dmmfField.type;
                if (dmmfField.isList) {
                    type = (0, util_1.arrayify)(type);
                }
                decorator.params.push(`(type) => ${type}`);
            }
            if (dmmfField.isRequired === false) {
                decorator.params.push(`{nullable : true}`);
            }
            return decorator;
        };
        this.extractSwaggerDecoratorFromField = (dmmfField) => {
            const options = {};
            const name = dmmfField.isRequired === true
                ? 'ApiProperty'
                : 'ApiPropertyOptional';
            const decorator = new decorator_component_1.DecoratorComponent({
                name: name,
                importFrom: '@nestjs/swagger',
            });
            if (dmmfField.isList) {
                options.isArray = true;
            }
            let type = this.getPrimitiveMapTypeFromDMMF(dmmfField);
            if (type && type !== 'any') {
                options.type = (0, util_1.capitalizeFirst)(type);
                decorator.params.push(options);
                return decorator;
            }
            type = dmmfField.type.toString();
            if (dmmfField.relationName) {
                options.type = (0, util_1.wrapArrowFunction)(dmmfField);
                decorator.params.push(options);
                return decorator;
            }
            if (dmmfField.kind === 'enum') {
                options.enum = dmmfField.type;
                options.enumName = (0, util_1.wrapQuote)(dmmfField);
            }
            decorator.params.push(options);
            return decorator;
        };
        this.extractValidationDecoratorsFromField = (dmmfField) => {
            const importFrom = 'class-validator';
            const decorators = [];
            if (dmmfField.isList) {
                const decorator = new decorator_component_1.DecoratorComponent({
                    name: 'IsArray',
                    importFrom,
                });
                decorators.push(decorator);
            }
            if (!dmmfField.isRequired) {
                const decorator = new decorator_component_1.DecoratorComponent({
                    name: 'IsOptional',
                    importFrom,
                });
                decorators.push(decorator);
            }
            const decoratorArgs = {
                name: undefined,
                importFrom,
                params: dmmfField.isList ? { each: true } : undefined,
            };
            if (dmmfField.type &&
                dmmfField.type !== 'any' &&
                dmmfField.kind !== 'enum') {
                switch (dmmfField.type) {
                    case 'String':
                        decoratorArgs.name = 'IsString';
                        break;
                    case 'Number':
                        decoratorArgs.name = 'IsNumber';
                        break;
                    case 'Decimal':
                        decoratorArgs.name = 'IsDecimal';
                        break;
                    case 'Float':
                        decoratorArgs.name = 'IsDecimal';
                        break;
                    case 'Object':
                        decoratorArgs.name = 'IsObject';
                        break;
                    case 'Json':
                        decoratorArgs.name = 'IsJson';
                        break;
                    case 'Boolean':
                        decoratorArgs.name = 'IsBoolean';
                        break;
                    case 'Date':
                        decoratorArgs.name = 'IsDate';
                        break;
                    case 'DateTime':
                        decoratorArgs.name = 'IsDate';
                        break;
                    case 'Int':
                        decoratorArgs.name = 'IsInt';
                        break;
                    case 'BigInt':
                        decoratorArgs.name = 'IsInt';
                        break;
                    case 'SmallInt':
                        decoratorArgs.name = 'IsInt';
                        break;
                    case 'Bytes':
                        decoratorArgs.name = 'Type';
                        decoratorArgs.importFrom = 'class-transformer';
                        decoratorArgs.params = () => Buffer;
                }
                if (decoratorArgs.name) {
                    const decorator = new decorator_component_1.DecoratorComponent(decoratorArgs);
                    decorators.push(decorator);
                }
            }
            if (dmmfField.relationName) {
                decorators.push(new decorator_component_1.DecoratorComponent({
                    name: `ValidateNested`,
                    params: dmmfField.isList ? { each: true } : undefined,
                    importFrom,
                }));
                const relationType = (0, util_1.wrapArrowFunction)(dmmfField);
                const decorator = new decorator_component_1.DecoratorComponent({
                    name: 'Type',
                    params: relationType,
                    importFrom: 'class-transformer',
                });
                decorators.push(decorator);
            }
            if (dmmfField.kind === 'enum') {
                decoratorArgs.name = 'IsEnum';
                decoratorArgs.params = dmmfField.type;
                const decorator = new decorator_component_1.DecoratorComponent(decoratorArgs);
                decorators.push(decorator);
            }
            return decorators;
        };
        this.getClass = (input) => {
            const options = Object.assign({
                extractRelationFields: null,
                useGraphQL: false,
            }, input);
            const { model, extractRelationFields = null, postfix, useGraphQL, } = options;
            let className = model.name;
            if (postfix) {
                className += postfix;
            }
            const classComponent = new class_component_1.ClassComponent({ name: className });
            const relationTypes = (0, util_1.uniquify)(model.fields
                .filter((field) => extractRelationFields
                ? field.relationName
                : field.relationName && model.name !== field.type)
                .map((v) => v.type));
            const enums = model.fields.filter((field) => field.kind === 'enum');
            classComponent.fields = model.fields
                .filter((field) => {
                if (extractRelationFields === true) {
                    return field.relationName;
                }
                if (extractRelationFields === false) {
                    return !field.relationName;
                }
                return true;
            })
                .map((field) => this.convertField(field));
            classComponent.relationTypes =
                extractRelationFields === false ? [] : relationTypes;
            classComponent.enumTypes =
                extractRelationFields === true
                    ? []
                    : enums.map((field) => field.type.toString());
            if (useGraphQL) {
                const deco = new decorator_component_1.DecoratorComponent({
                    name: 'ObjectType',
                    importFrom: '@nestjs/graphql',
                });
                deco.params.push(JSON.stringify({
                    description: 'generated by [prisma-class-generator](https://github.com/kimjbstar/prisma-class-generator)',
                }));
                classComponent.decorators.push(deco);
                if (classComponent.enumTypes.length > 0) {
                    const extra = classComponent.enumTypes
                        .map((enumType) => `registerEnumType(${enumType}, {
	name: "${enumType}"
})`)
                        .join('\r\n\r\n');
                    classComponent.extra = extra;
                }
            }
            return classComponent;
        };
        this.getClasses = () => {
            const models = this.dmmf.datamodel.models;
            if (this.config.separateRelationFields === true) {
                return [
                    ...models.map((model) => this.getClass({
                        model,
                        extractRelationFields: true,
                        postfix: 'Relations',
                        useGraphQL: this.config.useGraphQL,
                    })),
                    ...models.map((model) => this.getClass({
                        model,
                        extractRelationFields: false,
                        useGraphQL: this.config.useGraphQL,
                    })),
                ];
            }
            return models.map((model) => this.getClass({ model, useGraphQL: this.config.useGraphQL }));
        };
        this.convertField = (dmmfField) => {
            var _a;
            const field = new field_component_1.FieldComponent({
                name: dmmfField.name,
                useUndefinedDefault: this._config.useUndefinedDefault,
            });
            let type = this.getPrimitiveMapTypeFromDMMF(dmmfField);
            if (this.config.useSwagger) {
                const decorator = this.extractSwaggerDecoratorFromField(dmmfField);
                field.decorators.push(decorator);
            }
            if (this.config.useValidation) {
                const decorators = this.extractValidationDecoratorsFromField(dmmfField);
                decorators.forEach((decorator) => field.decorators.push(decorator));
            }
            if (this.config.useGraphQL) {
                const decorator = this.extractTypeGraphQLDecoratorFromField(dmmfField);
                if (decorator) {
                    field.decorators.push(decorator);
                }
            }
            if (dmmfField.isRequired === false) {
                field.nullable = true;
            }
            if (this.config.useNonNullableAssertions) {
                field.nonNullableAssertion = true;
            }
            if (dmmfField.default) {
                if (typeof dmmfField.default !== 'object') {
                    field.default = (_a = dmmfField.default) === null || _a === void 0 ? void 0 : _a.toString();
                    if (dmmfField.kind === 'enum') {
                        field.default = `${dmmfField.type}.${dmmfField.default}`;
                    }
                    else if (dmmfField.type === 'BigInt') {
                        field.default = `BigInt(${field.default})`;
                    }
                    else if (dmmfField.type === 'String') {
                        field.default = `'${field.default}'`;
                    }
                }
                else if (Array.isArray(dmmfField.default)) {
                    if (dmmfField.type === 'String') {
                        field.default = `[${dmmfField.default
                            .map((d) => `'${d}'`)
                            .toString()}]`;
                    }
                    else {
                        field.default = `[${dmmfField.default.toString()}]`;
                    }
                }
            }
            if (type) {
                field.type = type;
            }
            else {
                field.type = dmmfField.type;
            }
            if (dmmfField.isList) {
                field.type = (0, util_1.arrayify)(field.type);
            }
            return field;
        };
    }
    get dmmf() {
        return this._dmmf;
    }
    set dmmf(value) {
        this._dmmf = value;
    }
    get config() {
        return this._config;
    }
    set config(value) {
        this._config = value;
    }
    static getInstance() {
        if (PrismaConvertor.instance) {
            return PrismaConvertor.instance;
        }
        PrismaConvertor.instance = new PrismaConvertor();
        return PrismaConvertor.instance;
    }
}
exports.PrismaConvertor = PrismaConvertor;
//# sourceMappingURL=convertor.js.map