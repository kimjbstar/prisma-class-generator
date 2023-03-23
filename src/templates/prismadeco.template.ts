export const PRISMADECO_TEMPLATE = `import 'reflect-metadata'

export class PrismaDecorators {
	static required(target: any, {kind, name}: ClassFieldDecoratorContext){
		if(kind !== 'field') return

		console.log(String(name), target)
	}

  static id(target: any, {kind, name}: ClassFieldDecoratorContext){
		if(kind !== 'field') return

		console.log("ID", String(name), target)
	}
}
`
