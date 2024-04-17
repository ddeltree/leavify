/* eslint-env node */
/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  overrides: [
    {
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              '..*',
              '@typings/*.js',
              '@changes/*.js',
              // '@accessors/*.js',
            ],
          },
        ],
      },
      files: ['src/**', 'utils/**'],
    },
  ],
};
