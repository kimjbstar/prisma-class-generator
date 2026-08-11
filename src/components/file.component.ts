import { pascalCase, snakeCase } from 'change-case'
import * as prettier from 'prettier'
import { ClassComponent } from './class.component'
import * as path from 'path'
import { getRelativeTSPath, prettierFormat, writeTSFile } from '../util'
import { Echoable } from '../interfaces/echoable'
import { ImportComponent } from './import.component'

export class FileComponent implements Echoable {
	private _dir?: string
	private _filename?: string
	private _imports?: ImportComponent[] = []
	private _prismaClass: ClassComponent
	private _clientImportPath: string
	private _useGraphQL: boolean
	private _prettierOptions: prettier.Options
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
		prettierOptions: prettier.Options
	}) {
		const {
			classComponent,
			output,
			clientImportPath,
			useGraphQL,
			prettierOptions,
		} = input
		this._prismaClass = classComponent
		this.dir = path.resolve(output)
		this.filename = `${snakeCase(classComponent.name)}.ts`
		this._clientImportPath = clientImportPath
		this._useGraphQL = useGraphQL
		this._prettierOptions = prettierOptions
		this.resolveImports()
	}

	echoImports = () => {
		return this.imports
			.reduce((result, importRow) => {
				result.push(importRow.echo())
				return result
			}, [])
			.join('\r\n')
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
		this.prismaClass.enumTypes.forEach((enumName) => {
			this.registerImport(enumName, this._clientImportPath)
		})

		this.prismaClass.decorators.forEach((decorator) => {
			this.registerImport(decorator.name, decorator.importFrom)
		})

		this.prismaClass.fields.forEach((field) => {
			field.decorators.forEach((decorator) => {
				this.registerImport(decorator.name, decorator.importFrom)
			})
		})

		if (this.prismaClass.types) {
			this.prismaClass.types.forEach((type) => {
				// must match the snake_case filename FileComponent itself generates below,
				// otherwise multi-word MongoDB composite type names (e.g. ShippingAddress)
				// import from a path that doesn't match the file actually written to disk.
				this.registerImport(type, './' + snakeCase(type))
			})
		}

		if (this._useGraphQL) {
			this.registerImport('ID', '@nestjs/graphql')
			this.registerImport('Int', '@nestjs/graphql')
			this.registerImport('registerEnumType', '@nestjs/graphql')
			this.registerImport('GraphQLJSONObject', 'graphql-type-json')
		}
	}

	write(dryRun: boolean) {
		const filePath = path.resolve(this.dir, this.filename)
		const content = prettierFormat(this.echo(), this._prettierOptions)
		writeTSFile(filePath, content, dryRun)
	}

	getRelativePath(to: string): string {
		return getRelativeTSPath(this.getPath(), to)
	}

	getPath() {
		return path.resolve(this.dir, this.filename)
	}
}
