import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })

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
    // Tailwind's config is CommonJS and loads plugins with require()
    files: ["tailwind.config.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
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
