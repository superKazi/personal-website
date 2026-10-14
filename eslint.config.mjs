import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import prettier from "eslint-config-prettier";
import functional from "eslint-plugin-functional";
import css from "@eslint/css";
import html from "@html-eslint/eslint-plugin";

export default defineConfig([
  { ignores: ["dist/"] },
  {
    files: ["src/**/*.ts", "eslint.config.mjs"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      functional.configs.externalTypeScriptRecommended,
      functional.configs.lite,
      functional.configs.stylistic,
    ],
    languageOptions: {
      // enable types for type-aware linting
      parserOptions: {
        projectService: { allowDefaultProject: ["eslint.config.mjs"] },
      },
    },
    rules: {
      // GSAP and DOM callbacks are void by design
      "functional/no-return-void": "off",
    },
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // OGL, lil-gui and the per-frame loop are mutation-based; allocating per frame would jank
      "functional/immutable-data": "off",
      "functional/no-loop-statements": "off",
    },
  },
  {
    files: ["src/**/*.css"],
    plugins: {
      css,
    },
    language: "css/css",
    rules: {
      "css/no-duplicate-imports": "error",
      "css/use-baseline": ["warn", { available: "widely" }],
    },
  },
  {
    files: ["src/**/*.html"],
    ...html.configs["flat/recommended"],
    rules: {
      ...html.configs["flat/recommended"].rules,
      // formatting is Prettier's job
      "@html-eslint/indent": "off",
      "@html-eslint/require-closing-tags": "off",
      "@html-eslint/no-extra-spacing-tags": "off",
      "@html-eslint/attrs-newline": "off",
      "@html-eslint/element-newline": "off",
      "@html-eslint/use-baseline": ["warn", { available: "widely" }],
    },
  },
  prettier,
]);
