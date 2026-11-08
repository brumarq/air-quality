import { readdirSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"
import tailwind from "eslint-plugin-tailwindcss"
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments"

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
// Commune content reaches features as props; only app/ reads content/ directly.
const NO_CONTENT = ban(["@/content/*", "@/content/**"], "Only app/ imports content/. Pass content to features as props.")

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

const FEATURES = readdirSync(join(ROOT, "features"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

const eslintConfig = [
  { ignores: ["lint-fixtures/**", ".next/**", ".next-e2e/**", "test-results/**", "playwright-report/**", "node_modules/**", "public/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // A disable comment for a hook or type rule hides a real bug, so those can't be
    // disabled at all. Any other disable must say why.
    plugins: { "@eslint-community/eslint-comments": eslintComments },
    rules: {
      "@eslint-community/eslint-comments/no-restricted-disable": ["error", "react-hooks/*", "@typescript-eslint/*"],
      "@eslint-community/eslint-comments/require-description": "error",
    },
  },
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
  {
    // A component defined inside another remounts (and loses its state) on every render.
    files: ["**/*.tsx"],
    rules: { "react/no-unstable-nested-components": "error" },
  },
  {
    // Feature components render view models. Loops belong in domain/ or a model file, and
    // the map is reached through hooks and *-layers.ts files, never from a component.
    files: ["features/*/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        NO_DYNAMIC_IMPORT,
        { selector: "ForStatement, ForOfStatement, ForInStatement", message: "Compute this in a view-model function, not in a component." },
        { selector: "ImportDeclaration[source.value='mapbox-gl']", message: "Components don't touch the map. Take a callback (e.g. onFlyTo) instead." },
      ],
    },
  },
  restrict(["app/**"], []),
  // One block per feature folder: the shared feature rules, plus "only your own domain".
  ...FEATURES.map((feature) =>
    restrict([`features/${feature}/**`], [
      ban(["@/features/*", "@/app/*", "@/app/**"], "Features must not import other features or app/. Inside a feature, use relative imports."),
      NO_CONTENT,
      {
        regex: `^@/domain/(?!(${feature}|shared|limits)(/|$))`,
        message: `features/${feature} may import domain/${feature}, domain/shared and domain/limits only.`,
      },
    ]),
  ),
  restrict(["map/**"], [
    ban(["@/features/*", "@/app/**", "@/api/*"], "map/ is generic Mapbox code: it may use domain/ but not features, app or api."),
    NO_CONTENT,
  ]),
  restrict(["api/**"], [
    ban(["@/features/*", "@/app/**", "@/map/*", "@/components/*", "@/components/**", "react", "mapbox-gl"], "api/ loads data: it may only use domain/ and data/."),
    NO_CONTENT,
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
    ban(["@/app/**", "@/features/*", "@/map/*", "@/api/*", "@/components/**", "@/lib/*", "@/data/**", "@/theme/*", "react", "react-dom", "mapbox-gl", "next", "next/*"], "domain/ is pure TypeScript: it may only import other domain/ files."),
    NO_CONTENT,
  ]),
  restrict(["components/ui/**"], [
    ban(["@/features/*", "@/app/**", "@/domain/*", "@/api/*", "@/map/*"], "components/ui/ holds shadcn primitives only."),
    NO_CONTENT,
  ]),
  restrict(["lib/**"], [ban(["@/features/*", "@/app/**"], "lib/ holds generic helpers."), NO_CONTENT]),
  {
    // content/ is per-commune config and copy: plain data typed by domain/.
    files: ["content/**"],
    rules: {
      "no-restricted-imports": "off",
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            PARENT_RELATIVE_IMPORT,
            { group: ["@/domain/*", "@/domain/**"], allowTypeImports: true, message: "content/ may import domain/ types only (import type)." },
            {
              group: ["@/app/**", "@/features/*", "@/features/**", "@/map/*", "@/api/*", "@/components/**", "@/lib/*", "@/theme/*", "@/data/**", "react", "react-dom", "mapbox-gl", "next", "next/*"],
              message: "content/ is plain data: it may import domain/ types only.",
            },
          ],
        },
      ],
    },
  },
  {
    // theme/ is the single source of colour values and depends on nothing.
    files: ["theme/**"],
    rules: { "no-restricted-syntax": ["error", NO_DYNAMIC_IMPORT, { selector: "ImportDeclaration", message: "theme/ imports nothing." }] },
  },
]

export default eslintConfig
