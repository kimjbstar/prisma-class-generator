import {
	GeneratorFormatNotValidError,
	GeneratorPathNotExists,
	handleGenerateError,
} from './error-handler'
import { REPO_URL } from './generator'
import * as util from './util'

jest.mock('./util', () => ({
	log: jest.fn(),
}))

describe('handleGenerateError', () => {
	afterEach(() => {
		jest.clearAllMocks()
	})

	const loggedText = (): string =>
		(util.log as jest.Mock).mock.calls.map((call) => call[0]).join('\n')

	it('GeneratorFormatNotValidError는 옵션 사용법과 입력값을 출력한다', () => {
		handleGenerateError(
			new GeneratorFormatNotValidError(
				'parseBoolean failed : "nope" is not boolean type',
			),
		)
		const logged = loggedText()
		expect(logged).toContain('Usage :')
		expect(logged).toContain('dryRun')
		expect(logged).toContain('Your Input')
		expect(logged).toContain(
			'parseBoolean failed : "nope" is not boolean type',
		)
	})

	it('GeneratorPathNotExists는 에러 메시지를 그대로 출력한다', () => {
		handleGenerateError(
			new GeneratorPathNotExists('no client generator found'),
		)
		expect(util.log).toHaveBeenCalledWith('no client generator found')
	})

	// regression test for the DX improvement: an unanticipated error should point at both
	// filing an issue and sending a PR directly, since this generator is often run unattended
	// by a coding agent that can act on a direct link/instruction.
	it('예상 못한 에러는 이슈/PR 링크와 함께 스택 트레이스를 출력한다', () => {
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => undefined)

		const error = new TypeError('boom')
		handleGenerateError(error)

		const logged = loggedText()
		expect(logged).toContain('Unexpected error: boom')
		expect(logged).toContain(`${REPO_URL}/issues/new`)
		expect(logged).toContain('CONTRIBUTING.md')
		expect(consoleErrorSpy).toHaveBeenCalledWith(error)

		consoleErrorSpy.mockRestore()
	})
})
