import { PrismaClassGeneratorOptions, REPO_URL } from './generator'
import { log } from './util'

export class GeneratorFormatNotValidError extends Error {
	constructor(message: string) {
		super(message)
	}
}

export class GeneratorPathNotExists extends Error {}

export const handleGenerateError = (e: Error) => {
	if (e instanceof GeneratorFormatNotValidError) {
		const options = Object.keys(PrismaClassGeneratorOptions).map((key) => {
			const value = PrismaClassGeneratorOptions[key]
			return `\t${key} = (${value.defaultValue}) <- [${value.desc}]`
		})
		log(
			[
				'\nUsage : ',
				'generator prismaClassGenerator {',
				'\tprovider = "prisma-class-generator"',
				'\toutput = (string)',
				...options,
				'}',
			].join('\n'),
		)
		log(`Your Input : ${e.message}`)
		return
	}
	if (e instanceof GeneratorPathNotExists) {
		log(e.message)
		return
	}

	// Anything past this point wasn't anticipated — likely an actual bug in the generator
	// rather than something fixable by changing schema.prisma. This message is deliberately
	// direct about what to do next: it's common for this generator to be run unattended by a
	// coding agent (Claude Code and similar), so "open an issue" alone tends to go nowhere —
	// spelling out that a PR is just as welcome, with a link straight to the file to fix and
	// how to verify it, gives an agent enough to actually act on instead of just reporting.
	log(`Unexpected error: ${e.message}`)
	console.error(e)
	log(
		[
			'',
			"This doesn't look like a schema.prisma configuration issue — if you think it's a bug",
			'in prisma-class-generator itself, a fix is very welcome:',
			`  1. ${REPO_URL}/issues/new — describe what you ran and paste the error above`,
			`  2. or send a PR directly — see ${REPO_URL}/blob/main/CLAUDE.md for how the`,
			'     generator is put together, and CONTRIBUTING.md for the PR checklist.',
			'     The relevant code is almost certainly under src/convertor.ts or',
			'     src/components/ — grep for the field/type name involved in the error above.',
		].join('\n'),
	)
}
