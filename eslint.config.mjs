import js from '@eslint/js';
import tsEslintPlugin from '@typescript-eslint/eslint-plugin';
import tsEslintParser from '@typescript-eslint/parser';

const typescriptFiles = ['**/*.{ts,tsx,mts,cts}'];

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/dist/**',
      '**/build/**',
      '**/.pnpm-store/**'
    ]
  },
  js.configs.recommended,
  {
    files: typescriptFiles,
    languageOptions: {
      parser: tsEslintParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tsEslintPlugin
    },
    rules: {
      ...tsEslintPlugin.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error'
    }
  }
];
