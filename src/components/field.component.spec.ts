import { FieldComponent } from './field.component'

const makeField = (overrides: Partial<FieldComponent> = {}): FieldComponent => {
	const field = new FieldComponent({
		name: 'value',
		useUndefinedDefault: false,
	})
	Object.assign(field, overrides)
	return field
}

describe('FieldComponent#echo', () => {
	it('nullable 필드는 이름 뒤에 ?가 붙는다', () => {
		const field = makeField({ type: 'string', nullable: true })
		expect(field.echo()).toContain('value?: string')
	})

	it('preserveDefaultNullable가 켜지면 타입에 | null이 붙고 이름은 그대로 유지된다', () => {
		const field = makeField({
			type: 'string',
			nullable: true,
			preserveDefaultNullable: true,
		})
		const echoed = field.echo()
		expect(echoed).toContain('value: string | null')
		expect(echoed).not.toContain('value?:')
	})

	it('nonNullableAssertion이 켜지면 이름 뒤에 !가 붙는다', () => {
		const field = makeField({ type: 'string', nonNullableAssertion: true })
		expect(field.echo()).toContain('value!: string')
	})

	// regression test: `value!: number = 1` is TS1263 ("Declarations with initializers cannot
	// also have definite assignment assertions") — it doesn't compile, so useNonNullableAssertions
	// used to produce a broken file for any model with a literal @default(...). The initializer
	// already proves definite assignment, which is all the `!` was asserting.
	it('기본값이 있으면 nonNullableAssertion이 켜져 있어도 !를 붙이지 않는다', () => {
		const field = makeField({
			type: 'number',
			nonNullableAssertion: true,
			default: '1',
		})
		const echoed = field.echo()
		expect(echoed).toContain('value: number = 1')
		expect(echoed).not.toContain('!')
	})

	it('useUndefinedDefault로 대입식이 생겨도 !를 붙이지 않는다', () => {
		const field = makeField({
			type: 'string',
			nonNullableAssertion: true,
			useUndefinedDefault: true,
		})
		const echoed = field.echo()
		expect(echoed).toContain('value: string = undefined')
		expect(echoed).not.toContain('!')
	})

	// regression test for #34/#56/#76: echo()가 더 이상 Date.parse 휴리스틱으로
	// 기본값을 추측하지 않고, convertor가 넘겨준 문자열을 그대로 출력해야 한다.
	it('숫자 문자열 기본값을 Date로 추측해서 감싸지 않는다', () => {
		const field = makeField({ type: 'number', default: '1' })
		expect(field.echo()).toContain('value: number = 1')
		expect(field.echo()).not.toContain('new Date')
	})

	it('convertor가 만들어준 new Date(...) 리터럴은 그대로 출력한다', () => {
		const field = makeField({
			type: 'Date',
			default: "new Date('2024-01-01T00:00:00.000Z')",
		})
		expect(field.echo()).toContain(
			"value: Date = new Date('2024-01-01T00:00:00.000Z')",
		)
	})

	it('기본값이 없고 useUndefinedDefault가 켜지면 undefined를 대입한다', () => {
		const field = makeField({ type: 'string', useUndefinedDefault: true })
		expect(field.echo()).toContain('value: string = undefined')
	})

	it('기본값도 useUndefinedDefault도 없으면 대입식이 없다', () => {
		const field = makeField({ type: 'string' })
		expect(field.echo()).not.toContain('=')
	})
})
