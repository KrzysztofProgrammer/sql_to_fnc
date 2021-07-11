module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: [
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
    "@typescript-eslint/no-unused-vars-experimental": "error",
    "import/prefer-default-export": "off",
    "class-methods-use-this": "off"
  },
};
