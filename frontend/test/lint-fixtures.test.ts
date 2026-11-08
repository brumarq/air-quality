// Lints every file in lint-fixtures/ at the path its header names, and checks that exactly
// the expected rules fire. If a config change or the "@/" resolver ever stops a rule from
// firing, this fails instead of the rule going quiet.
//
// Each fixture starts with:
//   // path: <where the code pretends to live, e.g. features/heat/fixture.ts>
//   // expect: <comma-separated rule ids, or "clean">

import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { ESLint } from "eslint"
import { describe, expect, it } from "vitest"

const ROOT = join(__dirname, "..")
const FIXTURES = join(ROOT, "lint-fixtures")

const eslint = new ESLint({ cwd: ROOT, ignore: false })

function header(source: string, key: string): string {
  const match = new RegExp(`^// ${key}: (.+)$`, "m").exec(source)
  if (!match?.[1]) throw new Error(`fixture is missing its "// ${key}:" line`)
  return match[1].trim()
}

const fixtures = readdirSync(FIXTURES).map((name) => {
  const source = readFileSync(join(FIXTURES, name), "utf8")
  const expected = header(source, "expect")
  return { name, source, path: header(source, "path"), expected: expected === "clean" ? [] : expected.split(/,\s*/).sort() }
})

describe("lint rules fire exactly where expected", () => {
  it.each(fixtures)("$name", async ({ source, path, expected }) => {
    const [result] = await eslint.lintText(source, { filePath: join(ROOT, path) })
    const fired = [...new Set(result?.messages.map((m) => m.ruleId ?? `fatal: ${m.message}`))].sort()
    expect(fired).toEqual(expected)
  })
})
