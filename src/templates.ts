export const ROOT_TEMPLATE = `#!{IMPORTS}

export namespace PrismaModel {
#!{CLASSES}

export const extraModels = #!{CLASSE_NAMES}
}`;

export const FIELD_TEMPLATE = `	#!{DECORATORS}
	#!{NAME}: #!{TYPE}
	`;

export const CLASS_TEMPLATE = `#!{IMPORTS}

export class #!{NAME} {
#!{FIELDS}
}`;
