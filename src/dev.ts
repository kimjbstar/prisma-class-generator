import { PrismaClient } from "@prisma/client";
import { DMMFClass } from "@prisma/client/runtime";
import { writeFromDMMF } from "./prismaToClass";

const prisma = new PrismaClient();
// @ts-ignore
const dmmf: DMMFClass = prisma._dmmf;

writeFromDMMF({
  dmmf: dmmf,
  outputType: "console",
  targetDir: "./output",
  useSwagger: true,
});
