export const CLASS_TEMPLATE = `#!{IMPORTS}
import { Prisma } from "@prisma/client";
import { PrismaModel } from './PrismaModel'

#!{DECORATORS}
export class #!{NAME} {
  static model: #!{PRISMAMODEL_TYPE} = #!{PRISMAMODEL_VALUE}
#!{FIELDS}
#!{CONSTRUCTOR}
#!{MODEL_GETTER}
#!{FROMID}
}
#!{EXTRA}
`
