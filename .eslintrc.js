module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-native/all',
    'prettier',
  ],
  plugins: ['react', 'react-native', 'prettier'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  env: {
    'react-native/react-native': true,
  },
  rules: {
    'prettier/prettier': 'error',
    'react/prop-types': 'off',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}; 