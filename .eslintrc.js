module.exports = {
	env: {
		es2020: true,
		node: true,
		mocha: true,
	},
	extends: ['standard'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: 'tsconfig.json',
		sourceType: 'module',
	},
	root: true,
	rules: {
		'comma-dangle': ['warn', 'always-multiline'],
		'indent': ['warn', 'tab'],
		'no-tabs': 'off',
		'quote-props': ['warn', 'consistent-as-needed'],
	},
}
