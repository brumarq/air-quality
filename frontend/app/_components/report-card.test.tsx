import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { ReportCard } from "./report-card"

describe("ReportCard", () => {
  it("rotates the chevron's wrapper, not the SVG, so the browser can GPU-animate it", () => {
    render(<ReportCard />)
    fireEvent.click(screen.getByText("Sources and method"))
    const svg = screen.getByText("Sources and method").parentElement?.querySelector("svg")
    expect(svg?.getAttribute("class")).not.toContain("rotate")
    expect(svg?.parentElement?.className).toContain("rotate-180")
  })
})
