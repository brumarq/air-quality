// Tailwind only generates classes it finds in its `content` globs, so a component folder
// missing from them renders unstyled with no error anywhere. That happened: features/ and
// map/ were missing, and their colours, the live dot and the story panel width never
// rendered.

import { readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import config from "@/tailwind.config"

const ROOT = join(__dirname, "..")
const NOT_APP_CODE = new Set(["node_modules", "test", "e2e", "lint-fixtures", "public", "data"])

function hasTsx(dir: string): boolean {
  return readdirSync(dir, { withFileTypes: true }).some((entry) =>
    entry.isDirectory() ? hasTsx(join(dir, entry.name)) : entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx"),
  )
}

const componentFolders = readdirSync(ROOT, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith(".") && !NOT_APP_CODE.has(e.name))
  .filter((e) => hasTsx(join(ROOT, e.name)))
  .map((e) => e.name)

describe("Tailwind content globs", () => {
  it.each(componentFolders)("cover %s/", (folder) => {
    expect(config.content).toContain(`./${folder}/**/*.{ts,tsx}`)
  })
})
