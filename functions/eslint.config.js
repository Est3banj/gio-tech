// functions/eslint.config.js
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      ecmaVersion: 2022,
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly"
      }
    },
    rules: {
      "no-undef": "off",        // evita los falsos positivos con require/module/exports
      "no-unused-vars": "warn"  // opcional: que no bloquee el deploy
    }
  }
];