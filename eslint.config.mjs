/**
 * @fileoverview ESLint Configuration
 * @description Next.js 15+ ESLint flat config with TypeScript, React Hooks,
 * accessibility, and Prettier integration.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @see https://nextjs.org/docs/app/building-your-application/configuring/eslint
 */

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";

// ============================================
// FILE PATTERNS
// ============================================

/** JavaScript/TypeScript files */
const jsTsFiles = "**/*.{js,mjs,cjs,ts,tsx}";

/** Test files */
const testFiles = "**/*.{test,spec}.{ts,tsx}";

/** Config files */
const configFiles = [
  "*.config.{js,mjs,ts}",
  "*.setup.{js,ts}",
  "**/prisma/*.ts",
];

// ============================================
// IGNORED FILES
// ============================================

const ignoredPaths = globalIgnores([
  ".next/**",
  "out/**",
  "build/**",
  "dist/**",
  "node_modules/**",
  "next-env.d.ts",
  "coverage/**",
  "*.config.{js,mjs}.timestamp-*",
  ".vercel/**",
  "public/**",
  "src/generated/**",
]);

// ============================================
// ESLINT CONFIGURATION
// ============================================

const eslintConfig = defineConfig([
  // Base Next.js + TypeScript config
  ...nextVitals,
  ...nextTs,
  ignoredPaths,

  // ============================================
  // MAIN CONFIG (JS/TS files)
  // ============================================
  {
    files: [jsTsFiles],
    ignores: [testFiles, ...configFiles],
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      // Prettier integration
      "prettier/prettier": ["error", { endOfLine: "auto" }],

      // TypeScript strict rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",

      // React best practices
      "react/jsx-boolean-value": ["error", "never"],
      "react/jsx-curly-brace-presence": [
        "error",
        { props: "never", children: "never" },
      ],
      "react/self-closing-comp": "error",
      "react/jsx-sort-props": [
        "off",
        {
          callbacksLast: true,
          shorthandFirst: true,
          reservedFirst: true,
        },
      ],

      // Import rules
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "import/no-duplicates": "error",
      "import/no-unused-modules": "off",

      // General best practices
      "no-console": ["warn", { allow: ["error", "warn"] }],
      "no-debugger": "error",
      "no-alert": "error",
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
    },
  },

  // ============================================
  // TEST FILES CONFIG
  // ============================================
  {
    files: [testFiles],
    rules: {
      // Allow console in tests
      "no-console": "off",

      // Allow any in tests (for mocking)
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",

      // Allow expect assertions
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },

  // ============================================
  // CONFIG FILES (relaxed rules)
  // ============================================
  {
    files: configFiles,
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // ============================================
  // PRETTIER (must be last)
  // ============================================
  eslintConfigPrettier,
]);

export default eslintConfig;
