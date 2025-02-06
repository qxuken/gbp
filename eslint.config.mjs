import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config({languageOptions: { globals: globals.browser }},
    pluginJs.configs.recommended,
    eslintConfigPrettier,{
        rules: {
            indent: "error",
        },
    },
    ...tseslint.configs.strict,
    ...tseslint.configs.stylistic,
);
