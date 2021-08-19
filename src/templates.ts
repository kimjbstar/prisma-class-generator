export const rootTemplates = `#!{IMPORTS}

export namespace PrismaModel {
#!{CLASSES}

export const extraModels = #!{CLASSE_NAMES}
}`;

export const fieldTemplates = `	#!{DECORATORS}
	#!{NAME}: #!{TYPE}
	`;

export const classTemplates = `#!{IMPORTS}

export class #!{NAME} {
#!{FIELDS}
}`;
