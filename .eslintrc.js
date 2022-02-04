module.exports = {
  extends: ["google", "plugin:prettier/recommended"],
  rules: {
    "no-undef": "error",
  },
  env: {
    es6: true,
    node: true,
    browser: true,
    jest: true,
  },
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2018,
  },
};
