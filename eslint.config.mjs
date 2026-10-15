import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import prettier from "eslint-config-prettier";
import functional from "eslint-plugin-functional";
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
      // OGL and the per-frame loop are mutation-based; allocating per frame would jank
      "functional/immutable-data": "off",
      "functional/no-loop-statements": "off",
      // a gain left at Web Audio's default 1 played Safari Chimes ~16x too loud
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name='createGain']",
          message:
            "Use new GainNode(ctx, { gain }) so the gain never starts at the default 1.",
        },
        {
          selector:
            "NewExpression[callee.name='GainNode']:not(:has(Property[key.name='gain']))",
          message:
            "Give every GainNode an explicit starting gain: new GainNode(ctx, { gain }).",
        },
      ],
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
