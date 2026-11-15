import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { LUXEMBOURG } from "@/content/areas/luxembourg"
import { MapContainer } from "./map-container"

describe("MapContainer", () => {
  it("lets the pointer through to the map everywhere except on the cards, so the map stays draggable between them", () => {
    const { container } = render(
      <MapContainer mapContainer={() => {}} map={null} mapStatus={{ status: "ready", issue: null }} stations={{ status: "loading" }} area={LUXEMBOURG} />,
    )
    const overlay = container.querySelector(".absolute.inset-4")
    const cards = [...container.querySelectorAll(".pointer-events-auto")]
    expect(overlay?.classList.contains("pointer-events-none")).toBe(true)
    expect(cards.length).toBeGreaterThan(0)
    for (const card of cards) {
      for (let el = card.parentElement; el && el !== overlay; el = el.parentElement) {
        expect(el.classList.contains("pointer-events-none")).toBe(true)
      }
    }
  })
})
