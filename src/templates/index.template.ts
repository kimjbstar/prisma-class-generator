export const INDEX_TEMPLATE = `#!{IMPORTS}

export namespace PrismaModel {
#!{RE_EXPORT_CLASSES}

	export const extraModels = [
		#!{CLASSES}
	]
}`
