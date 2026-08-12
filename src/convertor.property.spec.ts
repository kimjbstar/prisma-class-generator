import fc from 'fast-check'
import { DMMF } from '@prisma/generator-helper'
import { PrismaConvertor } from './convertor'
import { PrismaClassGeneratorConfig } from './generator'

/**
 * Property-based regression coverage for the two areas of convertor.ts that have actually
 * shipped bugs before (see CLAUDE.md / CHANGELOG.md 0.3.0): default-value formatting
 * (#34/#56/#76 — a numeric default misdetected as a Date, and falsy defaults dropped) and,
 * this session, native-type-derived validators. Example-based tests in convertor.spec.ts
 * pin down specific known-tricky values; these properties explore the input space around
 * them instead of relying on a human to think of every edge case by hand.
 */

const defaultConfig: PrismaClassGeneratorConfig = {
	useSwagger: false,
	useGraphQL: false,
	useValidation: true,
	useUndefinedDefault: false,
	preserveDefaultNullable: false,
	useNonNullableAssertions: false,
}

const convertField = (
	field: Partial<DMMF.Field>,
	config: Partial<PrismaClassGeneratorConfig> = {},
) => {
	const convertor = new PrismaConvertor()
	convertor.config = { ...defaultConfig, ...config }
	const baseField: DMMF.Field = {
		kind: 'scalar',
		name: 'value',
		isRequired: true,
		isList: false,
		isUnique: false,
		isId: false,
		isReadOnly: false,
		hasDefaultValue: false,
		type: 'String',
		...field,
	}
	return convertor.convertField(baseField)
}

// DateTime is deliberately excluded: `new Date(...)` is the *correct* output for it, so a
// property asserting "never produces new Date" would be testing the wrong thing for that type.
const nonDateScalarType = fc.constantFrom(
	'Int',
	'Float',
	'Decimal',
	'Boolean',
	'String',
	'BigInt',
) as fc.Arbitrary<'Int' | 'Float' | 'Decimal' | 'Boolean' | 'String' | 'BigInt'>

const literalDefaultFor = (
	type: 'Int' | 'Float' | 'Decimal' | 'Boolean' | 'String' | 'BigInt',
): fc.Arbitrary<string | number | boolean> => {
	switch (type) {
		case 'Int':
		case 'BigInt':
			return fc.integer()
		case 'Float':
		case 'Decimal':
			return fc.double({ noNaN: true, noDefaultInfinity: true })
		case 'Boolean':
			return fc.boolean()
		case 'String':
			return fc.string()
	}
}

describe('PrismaConvertor#convertField 기본값 포맷팅 (property-based)', () => {
	// regression property for #34/#56/#76: the old code ran `Date.parse()` on the
	// stringified default to guess whether it "looked like" a date. Any Int/Float/Decimal/
	// Boolean/String/BigInt default -- no matter the value -- must never produce `new Date(...)`.
	it('DateTime이 아닌 타입은 어떤 리터럴 기본값을 줘도 new Date(...)를 생성하지 않는다', () => {
		fc.assert(
			fc.property(
				nonDateScalarType.chain((type) =>
					fc.record({
						type: fc.constant(type),
						value: literalDefaultFor(type),
					}),
				),
				({ type, value }) => {
					const field = convertField({
						type,
						default: value,
						hasDefaultValue: true,
					})
					expect(field.default).not.toMatch(/new Date/)
				},
			),
		)
	})

	// regression property for the falsy-default-dropped bug: `if (dmmfField.default)` used to
	// treat 0/false/'' as "no default". A defined default (including falsy ones) must always
	// come through as a non-empty `field.default` string.
	it('falsy 값(0, false, 빈 문자열)을 포함해 정의된 기본값은 항상 보존된다', () => {
		fc.assert(
			fc.property(
				nonDateScalarType.chain((type) =>
					fc.record({
						type: fc.constant(type),
						value: literalDefaultFor(type),
					}),
				),
				({ type, value }) => {
					const field = convertField({
						type,
						default: value,
						hasDefaultValue: true,
					})
					expect(field.default).toBeDefined()
					expect(field.default).not.toBe('')
				},
			),
		)
	})

	it('Int 기본값은 항상 그 숫자 그대로 리터럴로 나온다 (따옴표/변환 없음)', () => {
		fc.assert(
			fc.property(fc.integer(), (value) => {
				const field = convertField({
					type: 'Int',
					default: value,
					hasDefaultValue: true,
				})
				expect(field.default).toBe(String(value))
			}),
		)
	})

	it('String 기본값은 항상 작은따옴표로 감싸진다', () => {
		fc.assert(
			fc.property(
				fc.string().filter((s) => !s.includes("'")),
				(value) => {
					const field = convertField({
						type: 'String',
						default: value,
						hasDefaultValue: true,
					})
					expect(field.default).toBe(`'${value}'`)
				},
			),
		)
	})

	// BigInt is the one type whose literal default needs a runtime-valid initializer
	// expression (`BigInt(100)`, not the bare literal `100`) -- this locks that wrapping in
	// against any future reshaping of the default-formatting chain.
	it('BigInt 기본값은 항상 BigInt(...)로 감싸진다', () => {
		fc.assert(
			fc.property(fc.integer(), (value) => {
				const field = convertField({
					type: 'BigInt',
					default: value,
					hasDefaultValue: true,
				})
				expect(field.default).toBe(`BigInt(${value})`)
			}),
		)
	})

	// list-scalar defaults (`Int[] @default([1, 2, 3])`) take a separate branch from the
	// single-value formatting above -- covers Array.isArray(dmmfField.default) for both a
	// quoted-element type (String) and a bare-element type (Int).
	it('리스트 String 기본값은 각 원소가 따옴표로 감싸진 배열 리터럴로 나온다', () => {
		fc.assert(
			fc.property(
				fc.array(fc.string().filter((s) => !s.includes("'"))),
				(values) => {
					const field = convertField({
						type: 'String',
						default: values,
						hasDefaultValue: true,
					})
					const expected = `[${values.map((v) => `'${v}'`).toString()}]`
					expect(field.default).toBe(expected)
				},
			),
		)
	})

	it('리스트 Int 기본값은 원소가 그대로 나열된 배열 리터럴로 나온다', () => {
		fc.assert(
			fc.property(fc.array(fc.integer()), (values) => {
				const field = convertField({
					type: 'Int',
					default: values,
					hasDefaultValue: true,
				})
				expect(field.default).toBe(`[${values.toString()}]`)
			}),
		)
	})
})

describe('PrismaConvertor#getPrimitiveMapTypeFromDMMF (property-based)', () => {
	const allScalarTypes = fc.constantFrom(
		'BigInt',
		'Boolean',
		'Bytes',
		'DateTime',
		'Decimal',
		'Float',
		'Int',
		'Json',
		'String',
	)

	// the type mapping is a total function: every known scalar type, list or not, must
	// resolve to a non-empty TS type, and a list must always be `<type>[]`, never bare.
	it('모든 스칼라 타입 x isList 조합에서 빈 타입이 나오지 않는다', () => {
		fc.assert(
			fc.property(allScalarTypes, fc.boolean(), (type, isList) => {
				const field = convertField({ type, isList })
				expect(field.type).toBeTruthy()
				if (isList) {
					expect(field.type.endsWith('[]')).toBe(true)
				} else {
					expect(field.type.endsWith('[]')).toBe(false)
				}
			}),
		)
	})
})

describe('PrismaConvertor#extractValidationDecoratorsFromField 네이티브 타입 매핑 (property-based)', () => {
	const replacementCases = fc.constantFrom(
		['Uuid', 'IsUUID'],
		['UniqueIdentifier', 'IsUUID'],
		['ObjectId', 'IsMongoId'],
	) as fc.Arbitrary<[string, string]>

	it('nativeType이 format validator에 매핑되면 항상 그 validator로 대체되고 IsString은 사라진다', () => {
		fc.assert(
			fc.property(
				replacementCases,
				fc.boolean(),
				([nativeType, validator], isRequired) => {
					const field = convertField({
						type: 'String',
						isRequired,
						nativeType: [nativeType, []],
					} as Partial<DMMF.Field>)
					const echoed = field.echo()
					expect(echoed).toContain(`@${validator}()`)
					expect(echoed).not.toContain('@IsString()')
				},
			),
		)
	})

	const lengthConstraintType = fc.constantFrom(
		'VarChar',
		'NVarChar',
		'Char',
		'NChar',
	)

	it('길이 제약 nativeType은 항상 그 인자 값 그대로 @MaxLength(n)을 만든다', () => {
		fc.assert(
			fc.property(
				lengthConstraintType,
				fc.integer({ min: 1, max: 10_000 }),
				(nativeTypeName, length) => {
					const field = convertField({
						type: 'String',
						nativeType: [nativeTypeName, [String(length)]],
					} as Partial<DMMF.Field>)
					expect(field.echo()).toContain(`@MaxLength(${length})`)
				},
			),
		)
	})
})
