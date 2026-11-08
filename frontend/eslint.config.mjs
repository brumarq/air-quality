import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"
import tailwind from "eslint-plugin-tailwindcss"

const ROOT = dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({ baseDirectory: ROOT })

// Import direction: app -> features -> map / domain / api / components/ui.
// Each layer lists what it may NOT import. Outside code reaches a feature only
// through its index.ts, so deep imports like "@/features/heat/heat-layers" are banned.
const DEEP_FEATURE_IMPORT = {
  group: ["@/features/*/*"],
  message: "Import a feature through its index: \"@/features/<name>\".",
}
// Relative parent imports ("../x") would slip past the layer rules, so use "@/..." instead.
const PARENT_RELATIVE_IMPORT = {
  group: ["../*", "../**"],
  message: "Use an \"@/...\" import instead of \"../\".",
}
const ban = (groups, message) => ({ group: groups, message })

// no-restricted-imports doesn't look at import(), so a dynamic import would get past every
// rule above. Only app/ may use one (next/dynamic). ESLint replaces rather than merges a
// rule's options across config blocks, so every block that sets no-restricted-syntax
// must include this entry.
const NO_DYNAMIC_IMPORT = {
  selector: "ImportExpression",
  message: "Dynamic import() bypasses the layer rules. Only app/ may use it (for next/dynamic).",
}
const restrict = (files, patterns) => ({
  files,
  rules: { "no-restricted-imports": ["error", { patterns: [DEEP_FEATURE_IMPORT, PARENT_RELATIVE_IMPORT, ...patterns] }] },
})

const eslintConfig = [
  { ignores: ["lint-fixtures/**", ".next/**", ".next-e2e/**", "test-results/**", "playwright-report/**", "node_modules/**", "public/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    // A class Tailwind doesn't know renders as nothing, silently. This catches typos and
    // off-palette colours (theme.colors replaces the default palette). Folders missing
    // from the content globs are caught by test/tailwind-content.test.ts.
    files: ["**/*.tsx"],
    plugins: { tailwindcss: tailwind },
    settings: { tailwindcss: { config: join(ROOT, "tailwind.config.ts"), callees: ["cn", "cva"] } },
    rules: { "tailwindcss/no-custom-classname": "error" },
  },
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    ignores: ["app/**"],
    rules: { "no-restricted-syntax": ["error", NO_DYNAMIC_IMPORT] },
  },
  restrict(["app/**"], []),
  restrict(["features/**"], [
    ban(["@/features/*", "@/app/*", "@/app/**"], "Features must not import other features or app/. Inside a feature, use relative imports."),
  ]),
  restrict(["map/**"], [
    ban(["@/features/*", "@/app/**", "@/api/*"], "map/ is generic Mapbox code: it may use domain/ but not features, app or api."),
  ]),
  restrict(["api/**"], [
    ban(["@/features/*", "@/app/**", "@/map/*", "@/components/*", "@/components/**", "react", "mapbox-gl"], "api/ loads data: it may only use domain/ and data/."),
  ]),
  restrict(["domain/**"], [
    ban(["@/app/**", "@/features/*", "@/map/*", "@/api/*", "@/components/**", "@/lib/*", "@/data/**", "react", "react-dom", "mapbox-gl", "next", "next/*"], "domain/ is pure TypeScript: it may only import other domain/ files."),
  ]),
  restrict(["components/ui/**"], [
    ban(["@/features/*", "@/app/**", "@/domain/*", "@/api/*", "@/map/*"], "components/ui/ holds shadcn primitives only."),
  ]),
]

export default eslintConfig
