import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".pages-api/**",
      "coverage/**",
      "dist/**",
      "dist-dev/**",
      "docs/**",
      "lib/**",
      "node_modules/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: [ "**/*.{ts,tsx}" ],
  })),
  {
    files: [
      "examples/**/*.{ts,tsx}",
      "site/**/*.{ts,tsx}",
      "src/**/*.{ts,tsx}",
      "typing.d.ts",
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: [ "scripts/**/*.{js,mjs}", "*.{js,mjs}" ],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: [ "test/**/*.{js,ts,tsx}" ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
      },
    },
  },
  {
    files: [ "**/*.{ts,tsx}" ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowShortCircuit: true },
      ],
    },
  },
  {
    rules: {
      semi: [ "warn", "always" ],
      quotes: [ "warn", "double" ],
      indent: [ "warn", 2, { SwitchCase: 1 } ],
      "comma-dangle": [ "warn", "always-multiline" ],
      "eol-last": [ "warn", "always" ],
      "spaced-comment": [ "warn", "always" ],
      "object-curly-spacing": [ "warn", "always" ],
      "array-bracket-spacing": [ "warn", "always" ],
      "object-curly-newline": [
        "warn",
        { ImportDeclaration: { multiline: true, minProperties: 4 } },
      ],
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },
);
