import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"

describe("test setup", () => {
  it("renders into the page", () => {
    render(<p>left behind?</p>)
    expect(document.body.textContent).toBe("left behind?")
  })

  it("unmounts the previous test's render, since Testing Library only does it itself when test globals are on", () => {
    expect(document.body.textContent).toBe("")
  })
})
