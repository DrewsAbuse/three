import rules from '@shelf/eslint-config/typescript.js';

export default [
  ...rules,
  {files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx', '**/*.json']},
  {
    ignores: [
      '**/node_modules/',
      '**/coverage/',
      '**/lib/',
      'renovate.json',
      'tsconfig.json',
      ' **/src/**/*.d.ts',
      ' **/src/**/*.d.ts.map',
      ' **/src/**/*.d.tsx',
      ' **/src/**/*.d.tsx.map',
      ' **/src/**/*.d.js',
      ' **/src/**/*.d.js.map',
      ' **/src/**/*.d.jsx',
      ' **/src/**/*.js',
    ],
  },
];
