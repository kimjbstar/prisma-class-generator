import { PrismaClassGenerator } from '@src/generator'
import { Echoable } from '../interfaces/echoable'
import { PRISMAMODEL_TEMPLATE } from '../templates/prismamodel.template'
import * as path from 'path'
import { prettierFormat, writeTSFile } from '../util'
import { FileComponent } from './file.component'

export class PrismaModelComponent extends FileComponent {

	constructor(output: string) {
		super();
		this.dir = path.resolve(output)
		this.filename = "PrismaModel.ts"
	}

	echo = () => {
		return PRISMAMODEL_TEMPLATE
	}
}
