import { DMMF } from "@prisma/client/runtime";
import { PrismaClass, PrismaField } from "./prismaToClass";

export const convertField = (field: DMMF.Field): PrismaField => {
  const result: PrismaField = {
    swaggerOption: {},
    name: field.name,
  };
  const mapType: Record<string, string> = {
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
    result.swaggerOption.type = type.charAt(0).toUpperCase() + type.slice(1);
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

export const convertModel = (model: DMMF.Model): PrismaClass => {
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
