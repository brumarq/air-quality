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

// domain/ must give the same answer on any machine, in any zone or locale: no local-time
// setters, no locale formatting, no reading the clock, no parsing date strings.
const DOMAIN_PURITY = [
  {
    selector: "CallExpression[callee.property.name=/^(setHours|setMinutes|setSeconds|setDate|setMonth|setFullYear)$/]",
    message: "Local-time setters depend on the machine's zone. Use the helpers in domain/time.ts.",
  },
  {
    selector: "CallExpression[callee.property.name=/^toLocale.*String$/]",
    message: "Formatting is display work; do it in a feature, not in domain/.",
  },
  { selector: "NewExpression[callee.object.name='Intl']", message: "Intl formatting is display work; do it in a feature." },
  { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: "domain/ must not read the clock; take `now` as an argument." },
  { selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']", message: "domain/ must not read the clock; take `now` as an argument." },
  {
    selector: "NewExpression[callee.name='Date'][arguments.0.type=/^(Literal|TemplateLiteral)$/]",
    message: "Parsing a date string here can read it as local time. api/ turns strings into instants.",
  },
]

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
  {
    files: ["domain/**"],
    rules: {
      "no-restricted-syntax": ["error", NO_DYNAMIC_IMPORT, ...DOMAIN_PURITY],
      // A missing value is a case in the type (e.g. { status: "no-data" }), not a NaN.
      "no-restricted-globals": ["error", { name: "NaN", message: "Model a missing value in the type instead of NaN." }],
    },
  },
  restrict(["domain/**"], [
    ban(["@/app/**", "@/features/*", "@/map/*", "@/api/*", "@/components/**", "@/lib/*", "@/data/**", "react", "react-dom", "mapbox-gl", "next", "next/*"], "domain/ is pure TypeScript: it may only import other domain/ files."),
  ]),
  restrict(["components/ui/**"], [
    ban(["@/features/*", "@/app/**", "@/domain/*", "@/api/*", "@/map/*"], "components/ui/ holds shadcn primitives only."),
  ]),
]

export default eslintConfig
