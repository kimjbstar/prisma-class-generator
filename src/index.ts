import { generatorHandler, GeneratorOptions } from "@prisma/generator-helper";
import { PrismaClassGenerator } from "./generator";

generatorHandler({
  onManifest: () => ({
    defaultOutput: "../src/_gen/prisma-class",
    prettyName: "Prisma Class Generator",
  }),
  onGenerate: async (options: GeneratorOptions) => {
    const generator = PrismaClassGenerator.getInstance();
    generator.run(options);
  },
});
