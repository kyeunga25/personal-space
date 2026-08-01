import eslint from "@eslint/js";
import astro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

const typedFiles = ["src/**/*.ts", "tests/**/*.ts"];

export default tseslint.config(
  {
    ignores: [
      ".astro/**",
      ".wrangler/**",
      "dist/**",
      "node_modules/**",
      "worker-configuration.d.ts",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: typedFiles,
  })),
  ...astro.configs["flat/recommended"],
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: typedFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.worker,
      },
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
);
