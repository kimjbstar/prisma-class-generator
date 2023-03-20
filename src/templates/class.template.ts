export const CLASS_TEMPLATE = `#!{IMPORTS}
import { Prisma } from "@prisma/client";
import { required } from './PrismaModel'

#!{DECORATORS}
export class _#!{NAME} {
  static model: #!{PRISMAMODEL_TYPE}
#!{FIELDS}
#!{CONSTRUCTOR}
#!{MODEL_GETTER}
#!{FROMID}
}
#!{EXTRA}
`
