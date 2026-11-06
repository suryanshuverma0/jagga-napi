// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  prettierRecommended,
  {
    ignores: ['dist/*', 'android/*', 'ios/*', '.expo/*', 'coverage/*', 'docs/_site/*', 'scripts/out/*'],
  },
  {
    rules: {
      'no-console': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
  {
    files: ['scripts/**/*.js', 'config/**/*.js', '**/__tests__/**'],
    rules: { 'no-console': 'off' },
  },
  {
    // The maths core must stay framework-free.
    files: ['src/math/**/*.ts', 'src/units/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['react', 'react-native', 'react-native-*', 'expo*', '@/components/*', '@/app/*'] },
      ],
    },
  },
]);
