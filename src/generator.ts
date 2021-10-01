import { GeneratorOptions } from "@prisma/generator-helper";
import { Dictionary, parseEnvValue } from "@prisma/sdk";
import { snakeCase } from "change-case";
import * as fs from "fs";
import * as path from "path";
import { PrismaClassFile } from "./classes";
import { convertModels } from "./convertor";

export interface PrismaClassGeneratorOptions {
  foo: string;
  bar: string;
  useSwagger: boolean;
  dryRun: boolean;
}

export class PrismaClassGenerator {
  static instance: PrismaClassGenerator;

  static getInstance() {
    if (PrismaClassGenerator.instance) {
      return PrismaClassGenerator.instance;
    }
    this.instance = new PrismaClassGenerator();
    return this.instance;
  }

  run = async (options: GeneratorOptions): Promise<any> => {
    const output = parseEnvValue(options.generator.output!);
    const { generator, dmmf } = options;
    this.validateGeneratorConfig(generator.config);
    const config = this.applyDefaultConfig(generator.config);
    const { dryRun } = config;

    const classes = convertModels(dmmf, config);
    classes.forEach((_class) => {
      this.write({
        dirPath: output,
        fileName: `${snakeCase(_class.name)}.ts`,
        content: new PrismaClassFile(_class).echo(),
        dryRun: dryRun,
      });
    });

    return null;
  };

  write = (input: {
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

  validateGeneratorConfig = (config: Dictionary<string>) => {
    return true;
  };

  applyDefaultConfig = (
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
}
