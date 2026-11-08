import { describe, expect, it } from "vitest"

describe("test environment", () => {
  it("runs in Luxembourg time", () => {
    expect(new Date(Date.UTC(2026, 10, 8, 10)).getHours()).toBe(11)
  })
})
