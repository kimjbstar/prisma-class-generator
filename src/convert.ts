import { DMMF } from "@prisma/generator-helper";
import {
  PrismaClass,
  PrismaClassGeneratorOptions,
  PrismaField,
} from "./classes";
import { capitalizeFirst } from "./util";

export const convertField = (input: {
  dmmfField: DMMF.Field;
  config: PrismaClassGeneratorOptions;
}): PrismaField => {
  const { dmmfField, config } = input;
  const { useSwagger } = config;
  const field = new PrismaField({
    name: dmmfField.name,
  });
  const primitiveMapType: Record<string, string> = {
    Int: "number",
    String: "string",
    DateTime: "Date",
    Boolean: "boolean",
    Json: "any",
    BigInt: "bigint",
    Float: "number",
    Decimal: "number",
    Bytes: "Buffer",
  };
  let type = primitiveMapType[dmmfField.type];

  const apiPropertyParams: Record<string, any> = {};

  // primitive type
  if (type) {
    field.type = type;
    if (useSwagger) {
      apiPropertyParams["type"] = capitalizeFirst(type);
    }
    field.decorators.push({
      name: "ApiProperty",
      params: [apiPropertyParams],
    });
    return field;
  }
  type = dmmfField.type;

  if (dmmfField.isList) {
    field.type = type += "[]";
    if (useSwagger) {
      apiPropertyParams["isArray"] = true;
    }
  }

  if (dmmfField.relationName) {
    field.type = `${type}`;
    if (useSwagger) {
      apiPropertyParams["type"] = `() => ${dmmfField.type}`;
    }
    field.decorators.push({
      name: "ApiProperty",
      params: [apiPropertyParams],
    });
    return field;
  }

  if (dmmfField.kind === "enum") {
    if (useSwagger) {
      apiPropertyParams["enum"] = dmmfField.type;
      apiPropertyParams["enumName"] = `'${dmmfField.type}'`;
    }
    field.type = dmmfField.type;
  }

  if (useSwagger) {
    field.decorators.push({
      name: "ApiProperty",
      params: [apiPropertyParams],
    });
  }

  return field;
};

export const parseModels = (
  dmmf: DMMF.Document,
  config: PrismaClassGeneratorOptions,
): PrismaClass[] => {
  return dmmf.datamodel.models.map((model) =>
    convertModel({
      model: model,
      config: config,
    }),
  );
};

export const convertModel = (input: {
  model: DMMF.Model;
  config: PrismaClassGeneratorOptions;
}): PrismaClass => {
  const { model, config } = input;
  const pClass = new PrismaClass({
    name: model.name,
  });

  const relationTypes = model.fields
    .filter((field) => field.relationName && model.name !== field.type)
    .map((v) => v.type);
  const enums = model.fields.filter((field) => field.kind === "enum");
  const fields = model.fields.map((field) =>
    convertField({
      dmmfField: field,
      config: config,
    }),
  );
  pClass.relationTypes = relationTypes;
  pClass.fields = fields;
  pClass.relationTypes = [...new Set(relationTypes)];
  pClass.enumTypes = enums.map((field) => field.type);

  pClass.decorators.push({
    name: "ApiExtraModels",
    params: [pClass.name],
  });

  return pClass;
};
