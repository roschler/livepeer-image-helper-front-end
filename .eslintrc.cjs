/** @type {import("eslint").Linter.Config} */
const config = {
	// Tell ESLint we are running in a browser context so that
	//  it does not throw errors when we access a global
	//  browser variable like "window".
	/*
	"env": {
		"browser": true,
		"es2021": true
	},
	globals: [
		window
	],
	overrides: [
		{
			files: ["*.ts"],
			rules: {
				"no-undef": "off"
			}
		}
	],
	 */
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: true,
	},
	plugins: ["@typescript-eslint"],
	extends: [
		"next/core-web-vitals",
		"plugin:@typescript-eslint/recommended-type-checked",
		"plugin:@typescript-eslint/stylistic-type-checked",
	],
	rules: {
		"@typescript-eslint/array-type": "off",
		"@typescript-eslint/consistent-type-definitions": "off",
		"@typescript-eslint/consistent-type-imports": [
			"warn",
			{
				prefer: "type-imports",
				fixStyle: "inline-type-imports",
			},
		],
		"@typescript-eslint/no-unused-vars": [
			"warn",
			{
				argsIgnorePattern: "^_",
			},
		],
		"@typescript-eslint/require-await": "off",
		"@typescript-eslint/no-misused-promises": [
			"error",
			{
				checksVoidReturn: {
					attributes: false,
				},
			},
		],
	},
}
module.exports = config
