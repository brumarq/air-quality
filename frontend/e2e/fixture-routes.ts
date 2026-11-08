import type { Page } from "@playwright/test"
import { fixtureResponse } from "../test/fixture-api"

export const FIXTURE_API_BASE_URL = "http://api.fixture.test/api/v1/air-quality"

/** The clock the page runs on: a few hours after the fixture readings were captured. */
export const FIXED_NOW = new Date("2026-11-08T12:00:00Z")

/** Answers every backend request from the captured fixtures, and pins the page clock. */
export async function useFixtureBackend(page: Page) {
  await page.clock.setFixedTime(FIXED_NOW)
  await page.route("http://api.fixture.test/**", async (route) => {
    const response = fixtureResponse(new URL(route.request().url()))
    if (!response) return route.abort()
    return route.fulfill({ status: response.status, body: response.body, contentType: response.contentType })
  })
}

/** Collects console errors and uncaught exceptions; tests assert the list stays empty. */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("pageerror", (error) => errors.push(error.message))
  return errors
}
