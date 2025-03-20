export interface PrismaClassGeneratorOptions {
	/**
	 * @description make index file
	 * @default true
	 * @type boolean
	 */
	makeIndexFile: boolean
	/**
	 * @description dry run
	 * @default true
	 * @type boolean
	 */
	dryRun: boolean
	/**
	 * @description separate relation fields
	 * @default false
	 * @type boolean
	 */
	separateRelationFields: boolean
	/**
	 * @description use swagger decorstor
	 * @default true
	 * @type boolean
	 */
	useSwagger: boolean
	/**
	 * @description use graphql
	 * @default false
	 * @type boolean
	 */
	useGraphQL: boolean
	/**
	 * @description use undefined default
	 * @default false
	 * @type boolean
	 */
	useUndefinedDefault: boolean
	/**
	 * @description set prisma import path instead `@prisma/client`
	 * @default undefined
	 * @type string | undefined
	 */
	clientImportPath: string | undefined
	/**
	 * @description applies non-nullable assertions (!) to class properties
	 * @default false
	 * @type boolean
	 */
	useNonNullableAssertions: boolean
	/**
	 * @default false
	 * @description preserve default nullable behavior
	 * @type boolean
	 */
	preserveDefaultNullable: boolean
	/**
	 * @description name convention for generated classes file name
	 * @default 'snake'
	 * @type 'snake' | 'camel' | 'pascal' | 'kebab'
	 */
	nameConvention: 'snake' | 'camel' | 'pascal' | 'kebab'
}
