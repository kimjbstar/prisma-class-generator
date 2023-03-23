export declare const PRISMADECO_TEMPLATE = "import 'reflect-metadata'\n\nexport class PrismaDecorators {\n\tstatic required(target: any, {kind, name}: ClassFieldDecoratorContext){\n\t\tif(kind !== 'field') return\n\n\t\tconsole.log(String(name), target)\n\t}\n\n  static id(target: any, {kind, name}: ClassFieldDecoratorContext){\n\t\tif(kind !== 'field') return\n\n\t\tconsole.log(\"ID\", String(name), target)\n\t}\n}\n";
