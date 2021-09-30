import { GeneratorOptions } from "@prisma/generator-helper";
import { Dictionary, parseEnvValue } from "@prisma/sdk";
import { snakeCase } from "change-case";
import * as fs from "fs";
import * as path from "path";
import { PrismaClassGeneratorOptions } from "./classes";
import { convertModel } from "./convert";
import { echoClassContent } from "./createContent";
import { CLASS_TEMPLATE, FIELD_TEMPLATE } from "./templates";

export const validateGeneratorConfig = (config: Dictionary<string>) => {
  return true;
};

export const applyDefaultConfig = (
  config: Dictionary<string>,
): PrismaClassGeneratorOptions => {
  return Object.assign(
    {
      foo: "defaultFoo",
      bar: "defaultBar",
      useSwagger: true,
      dryRun: true,
    },
    config,
  ) as PrismaClassGeneratorOptions;
};

export const generateClasses = async (
  options: GeneratorOptions,
): Promise<any> => {
  const output = parseEnvValue(options.generator.output!);
  const { generator, dmmf } = options;
  validateGeneratorConfig(generator.config);
  const config = applyDefaultConfig(generator.config);
  const { useSwagger, dryRun } = config;

  const models = dmmf.datamodel.models;

  const classes = models.map((model) =>
    convertModel({
      model: model,
      config: config,
    }),
  );
  console.dir(classes, { depth: null });
  classes.forEach((_class) => {
    write({
      dirPath: output,
      fileName: `${snakeCase(_class.name)}.ts`,
      content: echoClassContent(_class, useSwagger),
      dryRun: dryRun,
    });
  });

  return null;
};

export const write = (input: {
  dirPath: string;
  fileName: string;
  content: string;
  dryRun: boolean;
}) => {
  const { dirPath, fileName, content, dryRun } = input;
  if (dryRun) {
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
