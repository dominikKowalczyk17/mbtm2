module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parser: 'babel-eslint',
  parserOptions: {
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
    sourceType: 'module',
    allowImportExportEverywhere: false,
  },
  plugins: ['babel'],
  extends: 'eslint:recommended',
  rules: {
    quotes: ["error", "single", { "avoidEscape": true }],
    'keyword-spacing': ["error", { "before": true, "after": true }],
    'space-before-blocks': "error",
    'arrow-spacing': "error",
    'comma-spacing': "error",
    'object-curly-newline': ["error", { "consistent": true }],
    'object-curly-spacing': ["error", "always"],
    'prefer-const': "error",
    semi: ['error', 'always', { omitLastInOneLineBlock: true }],
    indent: [
      'error',
      2,
      { SwitchCase: 1, VariableDeclarator: { var: 2, let: 2, const: 3 } },
    ],
    'no-case-declarations': 0,
  },
};
