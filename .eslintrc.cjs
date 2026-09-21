/** ESLint：静态检查代码错误与风格问题 */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  env: { node: true, browser: true, es2022: true },
  ignorePatterns: ["dist", "node_modules"]
};
