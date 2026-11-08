import { expect, test } from "@playwright/test"
import { collectPageErrors, useFixtureBackend } from "./fixture-routes"

test.beforeEach(async ({ page }) => {
  await useFixtureBackend(page)
})

async function waitForMap(page: import("@playwright/test").Page) {
  await expect(page.locator("canvas.mapboxgl-canvas")).toBeVisible()
  await expect(page.getByText("Loading map...")).toHaveCount(0, { timeout: 30_000 })
}

test("national overview shows the map and every station's readings", async ({ page }) => {
  const errors = collectPageErrors(page)
  await page.goto("/")
  await waitForMap(page)

  await expect(page.getByRole("heading", { name: "Air quality" })).toBeVisible()
  await expect(page.getByText("Mont St. Nicolas").first()).toBeVisible()
  await expect(page.getByText("Esch/Alzette").first()).toBeVisible()

  expect(errors).toEqual([])
})

test("Esch commune page shows readings, then the heat story in heat mode", async ({ page }) => {
  const errors = collectPageErrors(page)
  await page.goto("/communes/esch-sur-alzette")
  await waitForMap(page)

  await expect(page.getByText("Esch/Alzette").first()).toBeVisible()
  await expect(page.getByText(/NO₂ tubes · distance to the/)).toBeVisible()
  // Live mode marks each station's latest reading on the chart.
  await expect(page.locator(".recharts-reference-dot")).toHaveCount(1)

  await page.getByRole("radio", { name: "Summer heat" }).click()
  await expect(page.getByText("Satellite data backs the PRO-SUD heat study")).toBeVisible()

  expect(errors).toEqual([])
})
