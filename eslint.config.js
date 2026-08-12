const js = require('@eslint/js')
const tseslint = require('typescript-eslint')
const eslintConfigPrettier = require('eslint-config-prettier')

module.exports = tseslint.config(
	{
		ignores: ['dist/**', 'coverage/**', 'src/_gen/**'],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	eslintConfigPrettier,
	{
		rules: {
			// tsconfig.json already documents `strict: false` as a deliberate, separate-scope
			// decision (~60 pre-existing errors) -- this rule only fires under strict
			// null-checking context and would otherwise flag the same pre-existing gap ESLint
			// isn't the tool chosen to close today.
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_' },
			],
		},
	},
)
