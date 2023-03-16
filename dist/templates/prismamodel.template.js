"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRISMAMODEL_TEMPLATE = void 0;
exports.PRISMAMODEL_TEMPLATE = `import { Prisma, PrismaClient } from "@prisma/client";

export abstract class PrismaModel {
  static prisma: PrismaClient
  
  static async init(){
    // @ts-ignore
    BigInt.prototype.toJSON = ():string => {return this.toString()}
    if(PrismaModel.prisma === undefined){
      PrismaModel.prisma = new PrismaClient();
      await PrismaModel.prisma.$connect();
    }
  }

  static async destroy(){
    await PrismaModel.prisma.$disconnect();
  }
}
`;
//# sourceMappingURL=prismamodel.template.js.map