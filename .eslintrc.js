module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: [
      'import',
      '@typescript-eslint/eslint-plugin',
  ],
  extends: [
    "airbnb-typescript/base"
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "import/prefer-default-export": "off",
    "class-methods-use-this": "off"
  },
};
