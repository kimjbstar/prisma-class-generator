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
			// this codebase's string-template pipeline threads loosely-typed values through
			// DecoratorComponent#params, JSON.stringify inputs, etc. on purpose (see CLAUDE.md
			// -- it's a template-fill layer, not a place that benefits from an AST/type-safe
			// rewrite). Downgraded to a warning rather than disabled outright, so new `any`
			// usage is still visible without blocking unrelated work.
			'@typescript-eslint/no-explicit-any': 'warn',
			// tsconfig.json already documents `strict: false` as a deliberate, separate-scope
			// decision (~60 pre-existing errors) -- these two rules only fire under strict
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
