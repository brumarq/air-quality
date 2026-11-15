import { describe, expect, it } from "vitest"
import { isValidElement } from "react"
import { COMMUNES } from "@/content/communes"
import CommunePage from "./page"

describe("CommunePage", () => {
  it("passes the client map only serialisable props, since a server page can't send the content's functions", async () => {
    for (const commune of COMMUNES) {
      const element = await CommunePage({ params: Promise.resolve({ slug: commune.slug }) })
      if (!isValidElement(element)) throw new Error("expected an element")
      expect(() => structuredClone(element.props)).not.toThrow()
    }
  })
})
