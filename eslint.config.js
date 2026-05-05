import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import solidTsConfig from 'eslint-plugin-solid/configs/typescript';

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,

  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      ...solidTsConfig.plugins,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      ...solidTsConfig.rules,
      // TypeScript resolves identifiers; base no-undef misreports types/interfaces
      'no-undef': 'off',
      // Large legacy surface; tracked separately — enabling produces hundreds of non-actionable findings
      'solid/reactivity': 'off',
      'solid/style-prop': 'off',
      'solid/prefer-for': 'warn',
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-debugger': 'error',
      'no-unused-vars': 'off',
      'prefer-const': 'warn',
      'prefer-template': 'warn',
      'no-var': 'error',
      'object-shorthand': 'warn',
      'no-empty': 'warn',
      'no-useless-escape': 'warn',
      'no-case-declarations': 'warn',
    },
  },

  {
    files: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.vitest,
      },
    },
  },

  {
    files: ['tests/**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-undef': 'off',
      'prefer-const': 'warn',
      'prefer-template': 'warn',
      'no-var': 'error',
      'no-empty': 'warn',
      'no-useless-escape': 'warn',
      'no-case-declarations': 'warn',
    },
  },

  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'src-tauri/target/**',
      'src-tauri/gen/**',
      '*.config.js',
      '*.config.ts',
      '.vite/**',
    ],
  },
];
