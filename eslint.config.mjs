import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import prettier from "eslint-plugin-prettier"
import tanstackQuery from "@tanstack/eslint-plugin-query"

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	globalIgnores([
		".next/**",
		"out/**",
		"build/**",
		"next-env.d.ts",
		"node_modules/**",
		"dist/**",
		".turbo/**",
	]),
	{
		files: ["**/*.{js,jsx,ts,tsx}"],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			"simple-import-sort": simpleImportSort,
			prettier: prettier,
			"@tanstack/query": tanstackQuery,
		},
		rules: {
			"prettier/prettier": "error",

			"simple-import-sort/imports": [
				"error",
				{
					groups: [
						["^react", "^next", "^@?\\w"],
						["^(@|@company|@ui|components|utils|config|vendored)(/.*|$)"],
						["^\\u0000"],
						["^\\.\\.(?!/?$)", "^\\.\\./?$"],
						["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
						["^.+\\.s?css$"],
					],
				},
			],
			"simple-import-sort/exports": "error",

			"import/no-duplicates": "error",

			"react/react-in-jsx-scope": "off",
			"react/prop-types": "off",
			"react/display-name": "off",
			"react/no-unescaped-entities": "warn",
			"react/no-unknown-property": ["error", { ignore: ["jsx", "global"] }],
			"react/self-closing-comp": ["error", { component: true, html: true }],
			"react/jsx-boolean-value": ["error", "never"],
			"react/jsx-fragments": ["error", "syntax"],
			"react/jsx-no-useless-fragment": "error",
			"react/jsx-pascal-case": "error",
			"react/no-array-index-key": "warn",
			"react/no-danger": "warn",
			"react/no-unstable-nested-components": "error",
			"react/jsx-key": [
				"error",
				{
					checkFragmentShorthand: true,
					checkKeyMustBeforeSpread: true,
					warnOnDuplicates: true,
				},
			],

			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": [
				"warn",
				{
					additionalHooks: "(useMemo|useCallback)",
				},
			],

			"jsx-a11y/alt-text": "error",
			"jsx-a11y/anchor-has-content": "error",
			"jsx-a11y/anchor-is-valid": [
				"error",
				{
					components: ["Link"],
					specialLink: ["hrefLeft", "hrefRight"],
					aspects: ["invalidHref", "preferButton"],
				},
			],
			"jsx-a11y/aria-activedescendant-has-tabindex": "error",
			"jsx-a11y/aria-props": "error",
			"jsx-a11y/aria-proptypes": "error",
			"jsx-a11y/aria-role": ["error", { ignoreNonDOM: true }],
			"jsx-a11y/aria-unsupported-elements": "error",
			"jsx-a11y/click-events-have-key-events": "warn",
			"jsx-a11y/heading-has-content": "error",
			"jsx-a11y/html-has-lang": "error",
			"jsx-a11y/iframe-has-title": "error",
			"jsx-a11y/img-redundant-alt": "error",
			"jsx-a11y/interactive-supports-focus": "warn",
			"jsx-a11y/label-has-associated-control": "error",
			"jsx-a11y/media-has-caption": "warn",
			"jsx-a11y/mouse-events-have-key-events": "warn",
			"jsx-a11y/no-access-key": "error",
			"jsx-a11y/no-autofocus": ["error", { ignoreNonDOM: true }],
			"jsx-a11y/no-distracting-elements": "error",
			"jsx-a11y/no-interactive-element-to-noninteractive-role": "warn",
			"jsx-a11y/no-noninteractive-element-interactions": "warn",
			"jsx-a11y/no-noninteractive-element-to-interactive-role": "warn",
			"jsx-a11y/no-noninteractive-tabindex": "warn",
			"jsx-a11y/no-redundant-roles": "error",
			"jsx-a11y/no-static-element-interactions": "warn",
			"jsx-a11y/role-has-required-aria-props": "error",
			"jsx-a11y/role-supports-aria-props": "error",
			"jsx-a11y/scope": "error",
			"jsx-a11y/tabindex-no-positive": "warn",

			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/explicit-module-boundary-types": "off",
			"@typescript-eslint/no-non-null-assertion": "warn",
			"@typescript-eslint/prefer-nullish-coalescing": "error",
			"@typescript-eslint/prefer-optional-chain": "error",
			"@typescript-eslint/no-unnecessary-condition": "warn",
			"@typescript-eslint/no-unnecessary-type-assertion": "warn",
			"@typescript-eslint/await-thenable": "error",
			"@typescript-eslint/no-misused-promises": [
				"error",
				{
					checksVoidReturn: false,
				},
			],
			"@typescript-eslint/consistent-type-imports": [
				"error",
				{
					prefer: "type-imports",
					fixStyle: "inline-type-imports",
				},
			],
			"@typescript-eslint/consistent-type-definitions": ["error", "interface"],
			"@typescript-eslint/no-empty-function": "warn",
			"@typescript-eslint/no-empty-interface": "warn",
			"@typescript-eslint/no-inferrable-types": "error",
			"@typescript-eslint/prefer-as-const": "error",
			"@typescript-eslint/prefer-reduce-type-parameter": "error",
			"@typescript-eslint/prefer-string-starts-ends-with": "error",
			"@typescript-eslint/switch-exhaustiveness-check": "error",

			"@tanstack/query/exhaustive-deps": "warn",
			"@tanstack/query/no-rest-destructuring": "warn",
			"@tanstack/query/stable-query-client": "error",

			"no-console": [
				"warn",
				{
					allow: ["warn", "error"],
				},
			],
			"no-debugger": "error",
			"no-alert": "warn",
			"no-var": "error",
			"prefer-const": "error",
			"prefer-arrow-callback": "error",
			"prefer-template": "error",
			"prefer-destructuring": [
				"warn",
				{
					array: false,
					object: true,
				},
			],
			"prefer-rest-params": "error",
			"prefer-spread": "error",
			"prefer-promise-reject-errors": "error",
			"no-eval": "error",
			"no-implied-eval": "error",
			"no-new-func": "error",
			"no-param-reassign": [
				"error",
				{
					props: true,
					ignorePropertyModificationsFor: [
						"acc",
						"accumulator",
						"e",
						"ctx",
						"context",
						"req",
						"request",
						"res",
						"response",
						"$scope",
						"staticContext",
					],
				},
			],
			"no-return-await": "off",
			"no-throw-literal": "error",
			"no-unused-expressions": [
				"error",
				{
					allowShortCircuit: true,
					allowTernary: true,
					allowTaggedTemplates: true,
				},
			],
			"no-useless-return": "error",
			"no-useless-concat": "error",
			"no-useless-escape": "error",
			"no-useless-rename": "error",
			"no-void": "error",
			eqeqeq: ["error", "always", { null: "ignore" }],
			"dot-notation": "error",
			"no-else-return": ["error", { allowElseIf: false }],
			"no-lonely-if": "error",
			"no-nested-ternary": "warn",
			"no-unneeded-ternary": "error",
			"spaced-comment": [
				"error",
				"always",
				{
					markers: ["/"],
					exceptions: ["-", "+"],
				},
			],
			yoda: "error",
			"array-callback-return": ["error", { allowImplicit: true }],
			"no-array-constructor": "error",
			"no-iterator": "error",
			"no-new-wrappers": "error",
			"no-proto": "error",
			"no-sequences": "error",
			"no-shadow": "off",
			"no-undef-init": "error",
			"no-undefined": "off",
			"no-use-before-define": "off",
			"no-duplicate-imports": "off",
			"no-restricted-imports": [
				"error",
				{
					paths: [
						{
							name: "axios",
							message: "Use fetch or apiClient instead",
						},
					],
				},
			],
			"object-shorthand": ["error", "always"],
			"prefer-exponentiation-operator": "error",
			"prefer-numeric-literals": "error",
			"prefer-object-has-own": "error",
			"prefer-object-spread": "error",
			"prefer-regex-literals": "error",
			radix: "error",
			"symbol-description": "error",
			"no-await-in-loop": "warn",
			"no-promise-executor-return": "error",
			"require-atomic-updates": "error",
			"max-nested-callbacks": ["warn", { max: 5 }],
			complexity: ["warn", { max: 16 }],
			"max-depth": ["warn", { max: 5 }],
			"max-params": ["warn", { max: 5 }],
		},
	},
	{
		files: ["**/*.test.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}"],
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"max-lines": "off",
			"max-lines-per-function": "off",
		},
	},
	{
		files: ["**/*.config.{js,mjs,ts}", "**/next.config.{js,ts}"],
		rules: {
			"@typescript-eslint/no-var-requires": "off",
		},
	},
])

export default eslintConfig
