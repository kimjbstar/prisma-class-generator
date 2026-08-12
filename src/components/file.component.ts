import * as prettier from 'prettier'
import { ClassComponent } from './class.component'
import * as path from 'path'
import {
	getRelativeTSPath,
	prettierFormat,
	toSnakeCase,
	writeTSFile,
} from '../util'
import { Echoable } from '../interfaces/echoable'
import { ImportComponent } from './import.component'

export class FileComponent implements Echoable {
	private _dir: string
	private _filename: string
	private _imports: ImportComponent[] = []
	private _prismaClass: ClassComponent
	private _clientImportPath: string
	private _useGraphQL: boolean
	private _prettierOptions: prettier.Options | null
	static TEMP_PREFIX = '__TEMPORARY_CLASS_PATH__'

	public get dir() {
		return this._dir
	}

	public set dir(value) {
		this._dir = value
	}

	public get filename() {
		return this._filename
	}

	public set filename(value) {
		this._filename = value
	}

	public get imports() {
		return this._imports
	}

	public set imports(value) {
		this._imports = value
	}

	public get prismaClass() {
		return this._prismaClass
	}

	public set prismaClass(value) {
		this._prismaClass = value
	}

	constructor(input: {
		classComponent: ClassComponent
		output: string
		clientImportPath: string
		useGraphQL: boolean
		prettierOptions: prettier.Options | null
	}) {
		const {
			classComponent,
			output,
			clientImportPath,
			useGraphQL,
			prettierOptions,
		} = input
		this._prismaClass = classComponent
		// assigned through the backing fields rather than the `dir`/`filename` setters so
		// TypeScript can see them as definitely initialized here.
		this._dir = path.resolve(output)
		this._filename = `${toSnakeCase(classComponent.name)}.ts`
		this._clientImportPath = clientImportPath
		this._useGraphQL = useGraphQL
		this._prettierOptions = prettierOptions
		this.resolveImports()
	}

	echoImports = () => {
		return this.imports.map((importRow) => importRow.echo()).join('\r\n')
	}

	echo = () => {
		return this.prismaClass
			.echo()
			.replace('#!{IMPORTS}', this.echoImports())
	}

	registerImport(item: string, from: string) {
		const oldIndex = this.imports.findIndex(
			(_import) => _import.from === from,
		)
		if (oldIndex > -1) {
			this.imports[oldIndex].add(item)
			return
		}
		this.imports.push(new ImportComponent(from, item))
	}

	resolveImports() {
		this.registerGeneratedClassImports()
		this.registerExternalImports()
		this.registerRelationImports()
		this.registerEnumImports()
		this.registerPrismaNamespaceImport()
		this.registerDecoratorImports()
		this.registerCompositeTypeImports()
		this.registerGraphQLImports()
	}

	/** A DTO composes other generated classes and declares no fields of its own. */
	private get isMappedTypeDto() {
		return !!this.prismaClass.extendsExpression
	}

	private registerGeneratedClassImports() {
		this.prismaClass.generatedClassImports.forEach((className) => {
			// value import only, unlike relation fields: the name is used inside an `extends`
			// clause, which is a real runtime reference, so a type-only import can't serve it.
			this.registerImport(
				className,
				FileComponent.TEMP_PREFIX + className,
			)
		})
	}

	private registerExternalImports() {
		this.prismaClass.externalImports.forEach(({ item, from }) => {
			this.registerImport(item, from)
		})
	}

	private registerRelationImports() {
		this.prismaClass.relationTypes.forEach((relationClassName) => {
			this.registerImport(
				`${relationClassName}`,
				FileComponent.TEMP_PREFIX + relationClassName,
			)
			// Field *type annotations* use a `type`-only alias instead of the value import
			// above. TypeScript's emitDecoratorMetadata emits a runtime reference to a
			// property's declared type (`design:type`) — for two files that relate to each
			// other, that reference is eager, and under ESM's live-binding circular-import
			// semantics it throws "Cannot access 'X' before initialization" before both
			// classes finish initializing (reproduced with tsc + emitDecoratorMetadata +
			// native ESM output). A `type`-only import has no runtime value at all, so TS
			// can't emit a reference to it and falls back to a generic Object — no crash.
			// The decorator itself (e.g. `type: () => Book`) still uses the value import
			// above; only the field's own type annotation switches to the alias.
			this.registerImport(
				`type ${relationClassName} as ${relationClassName}AsType`,
				FileComponent.TEMP_PREFIX + relationClassName,
			)
		})
	}

	private registerEnumImports() {
		this.prismaClass.enumTypes.forEach((enumName) => {
			this.registerImport(enumName, this._clientImportPath)
		})
	}

	private registerPrismaNamespaceImport() {
		// preserveDecimal fields use `Prisma.Decimal` as their type (see convertor.ts) —
		// bring in the `Prisma` namespace from the same place the client itself comes from.
		if (
			this.prismaClass.fields.some((field) =>
				field.type?.startsWith('Prisma.'),
			)
		) {
			this.registerImport('Prisma', this._clientImportPath)
		}
	}

	private registerDecoratorImports() {
		this.prismaClass.decorators.forEach((decorator) => {
			this.registerImport(decorator.name, decorator.importFrom)
		})

		this.prismaClass.fields.forEach((field) => {
			field.decorators.forEach((decorator) => {
				this.registerImport(decorator.name, decorator.importFrom)
			})
		})
	}

	private registerCompositeTypeImports() {
		if (this.prismaClass.types) {
			this.prismaClass.types.forEach((type) => {
				// must match the snake_case filename FileComponent itself generates below,
				// otherwise multi-word MongoDB composite type names (e.g. ShippingAddress)
				// import from a path that doesn't match the file actually written to disk.
				this.registerImport(type, './' + toSnakeCase(type))
			})
		}
	}

	private registerGraphQLImports() {
		// These are emitted for any class that *might* reference them from a field decorator.
		// A DTO has no fields at all, so for those they'd be guaranteed-unused imports.
		if (this.isMappedTypeDto) {
			return
		}
		if (this._useGraphQL) {
			this.registerImport('ID', '@nestjs/graphql')
			this.registerImport('Int', '@nestjs/graphql')
			this.registerImport('registerEnumType', '@nestjs/graphql')
			this.registerImport('GraphQLJSONObject', 'graphql-type-json')
		}
	}

	async write(dryRun: boolean): Promise<void> {
		const filePath = path.resolve(this.dir, this.filename)
		const content = await prettierFormat(this.echo(), this._prettierOptions)
		writeTSFile(filePath, content, dryRun)
	}

	getRelativePath(to: string): string {
		return getRelativeTSPath(this.getPath(), to)
	}

	getPath() {
		return path.resolve(this.dir, this.filename)
	}
}
