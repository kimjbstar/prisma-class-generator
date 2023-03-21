"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRISMADECO_TEMPLATE = void 0;
exports.PRISMADECO_TEMPLATE = `import 'reflect-metadata'

export class PrismaDecorators {
  static metadataKeys = {
    required: Symbol('require'),
    id: Symbol('id')
  }

  // static required(){
  //   return Reflect.metadata(
  //     PrismaDecorators.metadataKeys.required,
  //     true
  //   )
  // }

  // static id(){
  //   return Reflect.metadata(
  //     PrismaDecorators.metadataKeys.id,
  //     true
  //   )
  // }

  static required = Reflect.metadata(
    PrismaDecorators.metadataKeys.required,
    true
  )

  static id = Reflect.metadata(
    PrismaDecorators.metadataKeys.required,
    true
  )

}
`;
//# sourceMappingURL=prismadeco.template.js.map