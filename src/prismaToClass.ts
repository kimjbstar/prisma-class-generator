import { DMMF, DMMFClass } from "@prisma/client/runtime";
import { pascalCase, snakeCase } from "change-case";
import * as path from "path";
import * as fs from "fs";
import { classTemplates, fieldTemplates, rootTemplates } from "./templates";

export type PrismaField = {
  swaggerOption?: Record<string, any>;
  name: string;
  type?: any;
};

export type PrismaClass = {
  name: string;
  fields?: PrismaField[];
  relationTypes?: string[];
  enumTypes?: string[];
};

export const convertField = (field: DMMF.Field): PrismaField => {
  const result: PrismaField = {
    swaggerOption: {},
    name: field.name,
  };
  const mapType = {
    Int: "number",
    String: "string",
    DateTime: "Date",
    Boolean: "boolean",
    Json: "JSON",
  };
  let type = mapType[field.type];

  // primitive type
  if (type) {
    result.type = type;
    result.swaggerOption.type = type.charAt(0).toUpperCase() + type.slice(1)
    return result;
  }
  type = field.type;

  if (field.isList) {
    result.type = type += "[]";
    result.swaggerOption.isArray = true;
  }

  if (field.relationName) {
    result.swaggerOption.type = `() => _${field.type}`;
    result.type = `_${type}`;
    return result;
  }

  if (field.kind === "enum") {
    result.swaggerOption.enum = field.type;
    result.swaggerOption.enumName = `'${field.type}'`;
    result.type = field.type;
  }

  return result;
};

export const convertDMMFModelToClass = (model: DMMF.Model): PrismaClass => {
  const relationTypes = model.fields
    .filter((field) => field.relationName && model.name !== field.type)
    .map((v) => v.type);
  const enums = model.fields.filter((field) => field.kind === "enum");

  return {
    name: model.name,
    fields: model.fields.map((field) => convertField(field)),
    relationTypes: [...new Set(relationTypes)],
    enumTypes: enums.map((field) => field.type),
  };
};

export const swaggerOptionToTemplate = (input: Record<string, any>): string => {
  const rows = Object.entries(input).reduce((result, [k, v]) => {
    result.push(`${k}:${v}`);
    return result;
  }, []);
  return `@ApiProperty({${rows.join(", ")}})`;
};

export const makeOutputFromPrismaClass = (
  pClass: PrismaClass,
  useSwagger = false
): string => {
  const fieldContent = pClass.fields.map((_field) =>
    fieldTemplates
      .replace("#!{NAME}", _field.name)
      .replace("#!{TYPE}", _field.type)
      .replace(
        "#!{DECORATORS}",
        useSwagger ? swaggerOptionToTemplate(_field.swaggerOption) : ""
      )
  );
  const toImports = pClass.relationTypes.map(
    (relationClassName) =>
      `import { _${pascalCase(relationClassName)} } from './${snakeCase(
        relationClassName
      )}'`
  );
  if (useSwagger) {
    toImports.push(`import { ApiProperty } from '@nestjs/swagger'`);
  }
  const enums = pClass.enumTypes.map(
    (enumName) => `import { ${enumName} } from '@prisma/client'`
  );
  return classTemplates
    .replace("#!{IMPORTS}", [...toImports, ...enums].join("\r\n"))
    .replace("#!{NAME}", `_${pClass.name}`)
    .replace("#!{FIELDS}", fieldContent.join("\r\n"));
};

export const makeRootOutputFromClasses = (classes: PrismaClass[]) => {
  return rootTemplates
    .replace(
      "#!{IMPORTS}",
      `${classes
        .map(
          (_class) =>
            `import { _${pascalCase(_class.name)} } from "./${snakeCase(
              _class.name
            )}"`
        )
        .join("\r\n")}`
    )
    .replace(
      "#!{CLASSES}",
      `${classes
        .map(
          (v) =>
            `export class ${pascalCase(v.name)} extends _${pascalCase(
              v.name
            )} {}`
        )
        .join(`\r\n`)}`
    )
    .replace(
      "#!{CLASSE_NAMES}",
      `[${classes.map((v) => pascalCase(v.name)).join(`, `)}]`
    );
};

export type writeFromDMMFInput = {
  dmmf: DMMFClass;
  outputType: "console" | "file";
  targetDir: string;
  useSwagger?: boolean;
};

export const writeFromDMMF = (input: writeFromDMMFInput) => {
  const { dmmf, outputType, targetDir, useSwagger = false } = input;
  const models = dmmf.datamodel.models;

  const classes = models.map((model) => convertDMMFModelToClass(model));
  classes.forEach((_class) => {
    const classOutput = makeOutputFromPrismaClass(_class, useSwagger);
    if (outputType === "console") {
      console.log(classOutput);
      return;
    }
    writeToFile({
      dirPath: targetDir,
      fileName: `${snakeCase(_class.name)}.ts`,
      content: classOutput,
    });
  });

  if (outputType === "file") {
    writeToFile({
      dirPath: targetDir,
      fileName: `model.ts`,
      content: makeRootOutputFromClasses(classes),
    });
  } else {
    console.log(makeRootOutputFromClasses(classes));
  }
};

export const writeToFile = (input: {
  dirPath: string;
  fileName: string;
  content: string;
}) => {
  const { dirPath, fileName, content } = input;
  const targetDirPath = path.resolve(dirPath, "_gen");
  if (fs.existsSync(targetDirPath) === false) {
    fs.mkdirSync(targetDirPath, { recursive: true });
  }
  const filePath = path.resolve(targetDirPath, fileName);
  console.log(`write to ${filePath}..`);
  fs.writeFileSync(filePath, content);
};
