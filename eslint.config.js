import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'project/automation-reports/**', 'public/mockServiceWorker.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': hooks, 'react-refresh': refresh },
    rules: { ...hooks.configs.recommended.rules, 'react-refresh/only-export-components': 'error' },
  },
  {
    files: ['src/domain/**/*.ts', 'src/simulation/**/*.ts'],
    languageOptions: { globals: Object.fromEntries(Object.keys({ ...globals.browser, ...globals.node }).map((key) => [key, 'off'])) },
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ regex: '^(?!\\.{1,2}/)', message: 'Pure modules use only relative domain/simulation imports.' }, { group: ['**/ui/**', '**/render/**', '**/input/**', '**/storage/**', '**/data/**'], message: 'Platform adapters depend on the core, never the reverse.' }] }],
      'no-restricted-globals': ['error', 'window', 'document', 'navigator', 'fetch', 'localStorage', 'sessionStorage', 'performance', 'Date', 'setTimeout', 'setInterval', 'requestAnimationFrame'],
      'no-restricted-properties': ['error', { object: 'Math', property: 'random', message: 'Randomness must be supplied explicitly.' }],
    },
  },
);
