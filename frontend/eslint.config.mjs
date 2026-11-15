import { readdirSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"
import tailwind from "eslint-plugin-tailwindcss"
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments"
import tseslint from "typescript-eslint"

const ROOT = dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({ baseDirectory: ROOT })

const FEATURES = readdirSync(join(ROOT, "features"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

const IMPORT_ZONES = [
  { target: "./shared", from: ["./features", "./content", "./app"], message: "shared/ must not import features, content or app." },
  { target: "./features", from: ["./content", "./app"], message: "Features take explicit values as props; they don't import content/ or app/." },
  { target: "./content", from: "./app", message: "content/ must not import app/." },
  ...FEATURES.map((feature) => ({
    target: `./features/${feature}`,
    from: "./features",
    except: [`./${feature}`],
    message: "Features must not import other features. Combine them in app/.",
  })),
]

const eslintConfig = [
  { ignores: [".next/**", ".next-e2e/**", "test-results/**", "playwright-report/**", "node_modules/**", "public/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: { "@eslint-community/eslint-comments": eslintComments },
    rules: {
      "@eslint-community/eslint-comments/no-restricted-disable": ["error", "react-hooks/*", "@typescript-eslint/*"],
      "@eslint-community/eslint-comments/require-description": "error",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser, parserOptions: { projectService: true, tsconfigRootDir: ROOT } },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/switch-exhaustiveness-check": ["error", { considerDefaultExhaustiveForUnions: false }],
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
    },
  },
  {
    files: ["**/*.tsx"],
    plugins: { tailwindcss: tailwind },
    settings: { tailwindcss: { config: join(ROOT, "tailwind.config.ts"), callees: ["cn", "cva"] } },
    rules: {
      "tailwindcss/no-custom-classname": "error",
      "react/no-unstable-nested-components": "error",
    },
  },
  {
    rules: { "import/no-restricted-paths": ["error", { basePath: ROOT, zones: IMPORT_ZONES }] },
  },
]

export default eslintConfig
