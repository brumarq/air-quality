import { describe, expect, it, vi } from "vitest"
import RootLayout from "./layout"
import { API_BASE_URL } from "@/features/air-quality/api"

const { preconnect } = vi.hoisted(() => ({ preconnect: vi.fn() }))
vi.mock("react-dom", async (importOriginal) => ({ ...(await importOriginal<typeof import("react-dom")>()), preconnect }))
vi.mock("next/font/google", () => ({ Inter: () => ({ className: "inter" }) }))


describe("RootLayout", () => {
  it("preconnects to Mapbox and the backend while the map code downloads, without credentials as both use CORS", () => {
    RootLayout({ children: null })
    expect(preconnect).toHaveBeenCalledWith("https://api.mapbox.com", { crossOrigin: "anonymous" })
    expect(preconnect).toHaveBeenCalledWith(new URL(API_BASE_URL).origin, { crossOrigin: "anonymous" })
  })
})
