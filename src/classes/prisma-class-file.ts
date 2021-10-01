import { pascalCase } from 'change-case'
import { PrismaClass } from './prisma-class'
import { PrismaImport } from './prisma-import'
import * as fs from 'fs'
import * as path from 'path'

export class PrismaClassFile {
	private dir?: string
	private filename?: string
	private imports?: PrismaImport[] = []
	private prismaClass: PrismaClass

	constructor(prismaClass: PrismaClass) {
		this.prismaClass = prismaClass
		this.addDefaultImports()
	}

	setDir(dir: string) {
		this.dir = dir
	}

	setFileName(filename: string) {
		this.filename = filename
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
		if (dryRun) {
			console.log(this.echo())
			return
		}

		const targetDirPath = path.resolve(this.dir, '_gen')
		if (fs.existsSync(targetDirPath) === false) {
			fs.mkdirSync(targetDirPath, { recursive: true })
		}
		const filePath = path.resolve(targetDirPath, this.filename)
		console.log(`write to ${filePath}..`)
		fs.writeFileSync(filePath, this.echo())
	}
}
