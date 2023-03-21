export const PRISMADECO_TEMPLATE = `import 'reflect-metadata'

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
`