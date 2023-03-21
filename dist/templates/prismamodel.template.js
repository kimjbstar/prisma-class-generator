"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRISMAMODEL_TEMPLATE = void 0;
exports.PRISMAMODEL_TEMPLATE = `import { PrismaClient } from "@prisma/client";
!#{CLASSES_IMPORTS}

export function required(target: any, propertyKey: string): any {
	console.log(propertyKey)
}

export abstract class PrismaModel {
  static prisma: PrismaClient
  
  static async init(){
    // @ts-ignore
    BigInt.prototype.toJSON = ():string => {return this.toString()}
    if(PrismaModel.prisma === undefined){
      PrismaModel.prisma = new PrismaClient();
      await PrismaModel.prisma.$connect();

      !#{CLASSES_INIT}
    }
  }

  static async destroy(){
    await PrismaModel.prisma.$disconnect();
  }
}
`;
//# sourceMappingURL=prismamodel.template.js.map