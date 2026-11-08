import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { bucketAxis, bucketStart, nextBucket, windowEndingAt, type Granularity } from "@/domain/shared/time"

const HOUR = 60 * 60 * 1000
const iso = (d: Date) => d.toISOString()
const at = (s: string) => new Date(Date.parse(s))

describe("hour buckets", () => {
  it("keeps both 00:xxZ and 01:xxZ on the autumn DST night (2026-10-25) as separate hours", () => {
    expect(iso(bucketStart("hour", at("2026-10-25T00:30:00Z")))).toBe("2026-10-25T00:00:00.000Z")
    expect(iso(bucketStart("hour", at("2026-10-25T01:30:00Z")))).toBe("2026-10-25T01:00:00.000Z")
    const axis = bucketAxis("hour", { from: at("2026-10-24T22:00:00Z"), to: at("2026-10-25T03:00:00Z") })
    expect(axis.map((d) => iso(d).slice(11, 16))).toEqual(["22:00", "23:00", "00:00", "01:00", "02:00", "03:00"])
  })

  it("has one bucket per hour on the spring DST night (2026-03-29)", () => {
    const axis = bucketAxis("hour", { from: at("2026-03-28T23:00:00Z"), to: at("2026-03-29T03:00:00Z") })
    expect(axis.map((d) => iso(d).slice(11, 16))).toEqual(["23:00", "00:00", "01:00", "02:00", "03:00"])
  })
})

describe("calendar buckets follow Luxembourg's calendar", () => {
  it("starts days at local midnight, 23 and 25 hours long on DST days", () => {
    expect(iso(bucketStart("day", at("2026-11-08T10:00:00Z")))).toBe("2026-11-07T23:00:00.000Z")
    expect(iso(bucketStart("day", at("2026-07-08T10:00:00Z")))).toBe("2026-07-07T22:00:00.000Z")
    const spring = bucketStart("day", at("2026-03-29T12:00:00Z"))
    expect(nextBucket("day", spring).getTime() - spring.getTime()).toBe(23 * HOUR)
    const autumn = bucketStart("day", at("2026-10-25T12:00:00Z"))
    expect(nextBucket("day", autumn).getTime() - autumn.getTime()).toBe(25 * HOUR)
  })

  it("starts eight-hour blocks at 00:00, 08:00 and 16:00 local", () => {
    const axis = bucketAxis("eightHour", { from: at("2026-10-24T22:00:00Z"), to: at("2026-10-25T23:00:00Z") })
    // 10-25 local 00:00 = 22:00Z (CEST); 08:00 = 07:00Z (CET) after the change; 16:00 = 15:00Z.
    expect(axis.map(iso)).toEqual([
      "2026-10-24T22:00:00.000Z",
      "2026-10-25T07:00:00.000Z",
      "2026-10-25T15:00:00.000Z",
      "2026-10-25T23:00:00.000Z",
    ])
  })

  it("starts months on the 1st at local midnight", () => {
    expect(iso(bucketStart("month", at("2026-11-08T10:00:00Z")))).toBe("2026-10-31T23:00:00.000Z")
    expect(iso(nextBucket("month", at("2026-02-28T23:00:00Z")))).toBe("2026-03-31T22:00:00.000Z")
  })
})

const GRANULARITIES: Granularity[] = ["hour", "eightHour", "day", "month"]
const instantIn2026 = fc
  .integer({ min: Date.UTC(2026, 0, 1), max: Date.UTC(2027, 0, 1) })
  .map((ms) => new Date(ms))

describe("bucket properties, all of 2026", () => {
  it("every instant falls in exactly the bucket [start, next)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...GRANULARITIES), instantIn2026, (g, t) => {
        const start = bucketStart(g, t)
        expect(start.getTime()).toBeLessThanOrEqual(t.getTime())
        expect(nextBucket(g, start).getTime()).toBeGreaterThan(t.getTime())
        expect(bucketStart(g, start).getTime()).toBe(start.getTime())
      }),
    )
  })

  it("the hourly axis has one entry per hour elapsed, ends included", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 365 * 24 }), fc.integer({ min: 0, max: 72 }), (startHour, hours) => {
        const from = new Date(Date.UTC(2026, 0, 1) + startHour * HOUR)
        expect(bucketAxis("hour", { from, to: new Date(from.getTime() + hours * HOUR) })).toHaveLength(hours + 1)
      }),
    )
  })
})

describe("windowEndingAt", () => {
  it("is the rolling window of whole days ending now", () => {
    const w = windowEndingAt(at("2026-11-08T12:00:00Z"), 7)
    expect([iso(w.from), iso(w.to)]).toEqual(["2026-11-01T12:00:00.000Z", "2026-11-08T12:00:00.000Z"])
  })
})
