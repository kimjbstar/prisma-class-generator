export const INDEX_TEMPLATE = `#!{IMPORTS}

export namespace PrismaModel {
	export const extraModels = [
		#!{CLASSES}
	]
}`
