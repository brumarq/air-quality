import { readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import config from "@/tailwind.config"

const ROOT = join(__dirname, "..")
const NOT_APP_CODE = new Set(["node_modules", "test", "e2e", "public", "data"])

function hasTsx(dir: string): boolean {
  return readdirSync(dir, { withFileTypes: true }).some((entry) =>
    entry.isDirectory() ? hasTsx(join(dir, entry.name)) : entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx"),
  )
}

const componentFolders = readdirSync(ROOT, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith(".") && !NOT_APP_CODE.has(e.name))
  .filter((e) => hasTsx(join(ROOT, e.name)))
  .map((e) => e.name)

describe("Tailwind palette", () => {
  it("replaces Tailwind's own colours instead of extending them, so an off-palette class like text-red-500 doesn't exist", () => {
    const colors = config.theme?.colors
    expect(colors && typeof colors === "object" && "red" in colors).toBe(false)
    expect("colors" in (config.theme?.extend ?? {})).toBe(false)
  })
})

describe("Tailwind content globs", () => {
  it.each(componentFolders)("cover %s/, since a folder missing from them renders unstyled with no error", (folder) => {
    expect(config.content).toContain(`./${folder}/**/*.{ts,tsx}`)
  })
})
