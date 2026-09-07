import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Reference mockups (plain React via CDN scripts, not part of the app source).
    "references/**",
  ]),
  // Código compacto: sin líneas en blanco. El hook PostToolUse aplica el --fix.
  {
    rules: {
      "no-multiple-empty-lines": ["error", { max: 0, maxEOF: 0, maxBOF: 0 }],
    },
  },
]);
export default eslintConfig;
