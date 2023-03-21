"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLASS_TEMPLATE = void 0;
exports.CLASS_TEMPLATE = `#!{IMPORTS}
import { Prisma } from "@prisma/client";
import { PrismaDecorators } from './PrismaDecorators'

#!{DECORATORS}
export class _#!{NAME} {
  static model: #!{PRISMAMODEL_TYPE}
#!{FIELDS}
#!{CONSTRUCTOR}
#!{MODEL_GETTER}
#!{FROMID}
}
#!{EXTRA}
`;
//# sourceMappingURL=class.template.js.map