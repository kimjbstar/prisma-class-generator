import { pascalCase } from 'change-case'
import { PrismaClass } from './prisma-class'
import { PrismaImport } from './prisma-import'
import * as fs from 'fs'
import * as path from 'path'
import { logger } from '@prisma/sdk'

export class PrismaClassFile {
	private _dir?: string
	private _filename?: string
	private _imports?: PrismaImport[] = []
	private _prismaClass: PrismaClass

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

	constructor(prismaClass: PrismaClass) {
		this.prismaClass = prismaClass
		this.addDefaultImports()
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

	addImport(exportedItem: string, from: string) {
		const oldIndex = this.imports.findIndex(
			(_import) => _import.from === from,
		)
		if (oldIndex > -1) {
			this.imports[oldIndex].add(exportedItem)
			return
		}
		this.imports.push(new PrismaImport(from, exportedItem))
	}

	addDefaultImports() {
		this.prismaClass.relationTypes.forEach((relationClassName) => {
			this.addImport(
				`${pascalCase(relationClassName)}`,
				relationClassName,
			)
		})
		this.prismaClass.enumTypes.forEach((enumName) => {
			this.addImport(enumName, '@prisma/client')
		})

		const apiPropertyDecorator = this.prismaClass.decorators.find(
			(decorator) => decorator.name === 'ApiProperty',
		)
		if (apiPropertyDecorator) {
			this.addImport('ApiProperty', '@nestjs/swagger')
		}
	}

	write(dryRun: boolean) {
		const targetDirPath = path.resolve(this.dir)
		if (fs.existsSync(targetDirPath) === false) {
			fs.mkdirSync(targetDirPath, { recursive: true })
		}
		const filePath = path.resolve(targetDirPath, this.filename)
		logger.info(`${dryRun ? '[dryRun] ' : ''}Generate ${filePath}`)
		if (dryRun) {
			console.log(this.echo())
			return
		}
		fs.writeFileSync(filePath, this.echo())
	}

	getRelativePath(prismaClassFile: PrismaClassFile): string {
		const from = path.resolve(this.dir, this.filename)
		const to = path.resolve(prismaClassFile.dir, prismaClassFile.filename)
		return path.relative(from, to)
	}

	getPath() {
		return path.resolve(this.dir, this.filename)
	}
}
