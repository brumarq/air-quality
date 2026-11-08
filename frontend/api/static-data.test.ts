import { afterEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { loadStaticJson } from "@/api/static-data"

afterEach(() => vi.unstubAllGlobals())

const Schema = z.object({ n: z.number() })
const respond = (response: Response | Error) =>
  vi.stubGlobal("fetch", () => (response instanceof Error ? Promise.reject(response) : Promise.resolve(response)))

describe("loadStaticJson", () => {
  it("returns validated data", async () => {
    respond(new Response(JSON.stringify({ n: 1 })))
    expect(await loadStaticJson("/data/x.json", Schema)).toEqual({ status: "ok", data: { n: 1 } })
  })

  it("treats 404 as not prepared", async () => {
    respond(new Response("", { status: 404 }))
    expect(await loadStaticJson("/data/x.json", Schema)).toEqual({ status: "not-prepared" })
  })

  it.each([
    ["a server error", new Response("", { status: 500 })],
    ["an unexpected shape", new Response(JSON.stringify({ n: "one" }))],
    ["a network failure", new TypeError("Failed to fetch")],
  ])("reports %s as an error, not as missing data", async (_name, response) => {
    respond(response)
    expect((await loadStaticJson("/data/x.json", Schema)).status).toBe("error")
  })
})
