import { DMMFClass } from "@prisma/client/runtime";
import { snakeCase } from "change-case";
import * as path from "path";
import * as fs from "fs";
import { createClassContent, createRootContent } from "./createContent";
import { convertModel } from "./convert";

export type ISwaggerOption = Record<string, any>;

export type PrismaField = {
  swaggerOption?: ISwaggerOption;
  name: string;
  type?: any;
};

export type PrismaClass = {
  name: string;
  fields?: PrismaField[];
  relationTypes?: string[];
  enumTypes?: string[];
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

  const classes = models.map((model) => convertModel(model));
  classes.forEach((_class) => {
    write({
      dirPath: targetDir,
      fileName: `${snakeCase(_class.name)}.ts`,
      content: createClassContent(_class, useSwagger),
      outputType: outputType,
    });
  });

  write({
    dirPath: targetDir,
    fileName: `model.ts`,
    content: createRootContent(classes),
    outputType: outputType,
  });
};

export const write = (input: {
  dirPath: string;
  fileName: string;
  content: string;
  outputType: "console" | "file";
}) => {
  const { dirPath, fileName, content, outputType } = input;
  if (outputType === "console") {
    console.log(content);
    return;
  }
  const targetDirPath = path.resolve(dirPath, "_gen");
  if (fs.existsSync(targetDirPath) === false) {
    fs.mkdirSync(targetDirPath, { recursive: true });
  }
  const filePath = path.resolve(targetDirPath, fileName);
  console.log(`write to ${filePath}..`);
  fs.writeFileSync(filePath, content);
};
