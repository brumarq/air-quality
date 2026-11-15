import { describe, expect, it, beforeAll, vi } from "vitest"
import fc from "fast-check"
import { bucketAxis, windowEndingAt, type Granularity, bucketTrend } from "./time"
import type { AirQualityStation } from "./model"
import { stubFetchWithFixtures } from "@/test/fixture-fetch"
import { eschNo2History } from "@/test/esch"

const { zonedDatesBuilt } = vi.hoisted(() => ({ zonedDatesBuilt: { count: 0 } }))
vi.mock("@date-fns/tz", async (importOriginal) => {
  const original = await importOriginal<typeof import("@date-fns/tz")>()
  const countedTz: typeof original.tz = (zone) => {
    const inZone = original.tz(zone)
    return (value) => {
      zonedDatesBuilt.count += 1
      return inZone(value)
    }
  }
  return { ...original, tz: countedTz }
})

const HOUR = 60 * 60 * 1000
const iso = (d: Date) => d.toISOString()
const at = (s: string) => new Date(Date.parse(s))
const lengths = (axis: Date[]) => axis.slice(1).map((d, i) => (d.getTime() - (axis[i]?.getTime() ?? 0)) / HOUR)

describe("hour buckets", () => {
  it("are built in UTC, since Luxembourg-zone hours drop the repeated autumn hour (2026-10-25)", () => {
    const axis = bucketAxis("hour", { from: at("2026-10-24T22:30:00Z"), to: at("2026-10-25T03:00:00Z") })
    expect(axis.map((d) => iso(d).slice(11, 16))).toEqual(["22:00", "23:00", "00:00", "01:00", "02:00", "03:00"])
  })

  it("has one bucket per hour on the spring DST night (2026-03-29)", () => {
    const axis = bucketAxis("hour", { from: at("2026-03-28T23:00:00Z"), to: at("2026-03-29T03:00:00Z") })
    expect(axis.map((d) => iso(d).slice(11, 16))).toEqual(["23:00", "00:00", "01:00", "02:00", "03:00"])
  })
})

describe("calendar buckets follow Luxembourg's calendar", () => {
  it("starts days at local midnight, 23 and 25 hours long on DST days", () => {
    expect(iso(bucketAxis("day", { from: at("2026-11-08T10:00:00Z"), to: at("2026-11-08T10:00:00Z") })[0] ?? at("1970"))).toBe("2026-11-07T23:00:00.000Z")
    expect(iso(bucketAxis("day", { from: at("2026-07-08T10:00:00Z"), to: at("2026-07-08T10:00:00Z") })[0] ?? at("1970"))).toBe("2026-07-07T22:00:00.000Z")
    expect(lengths(bucketAxis("day", { from: at("2026-03-28T12:00:00Z"), to: at("2026-03-30T12:00:00Z") }))).toEqual([24, 23])
    expect(lengths(bucketAxis("day", { from: at("2026-10-24T12:00:00Z"), to: at("2026-10-26T12:00:00Z") }))).toEqual([24, 25])
  })

  it("starts months on the 1st at local midnight", () => {
    const axis = bucketAxis("month", { from: at("2026-02-08T10:00:00Z"), to: at("2026-04-08T10:00:00Z") })
    expect(axis.map(iso)).toEqual(["2026-01-31T23:00:00.000Z", "2026-02-28T23:00:00.000Z", "2026-03-31T22:00:00.000Z"])
  })
})

const GRANULARITIES: Granularity[] = ["hour", "day", "month"]
const instantIn2026 = fc
  .integer({ min: Date.UTC(2026, 0, 1), max: Date.UTC(2027, 0, 1) })
  .map((ms) => new Date(ms))

describe("bucket properties, all of 2026", () => {
  it("every instant in the window falls in exactly one bucket [start, next start)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...GRANULARITIES), instantIn2026, (g, t) => {
        const axis = bucketAxis(g, { from: new Date(t.getTime() - 40 * 24 * HOUR), to: t })
        const last = axis.at(-1)
        expect(last && last <= t).toBe(true)
        expect(axis.slice(0, -1).every((start) => start < t)).toBe(true)
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
  it("is a rolling window of whole days ending now, not calendar-aligned", () => {
    const w = windowEndingAt(at("2026-11-08T12:00:00Z"), 7)
    expect([iso(w.from), iso(w.to)]).toEqual(["2026-11-01T12:00:00.000Z", "2026-11-08T12:00:00.000Z"])
  })
})

const station: AirQualityStation = { id: 1, name: "S", lat: 0, lng: 0, sensors: [] }
const utc = (iso: string) => new Date(Date.parse(iso))

function hourly(fromIso: string, toIso: string, timestamps: string[] = []) {
  const points = timestamps.map((timestamp, i) => ({ at: utc(timestamp), value: i + 1, unit: "µg/m³" }))
  const { axis, series } = bucketTrend([{ station, points }], "µg/m³", "hour", { from: utc(fromIso), to: utc(toIso) })
  return { axis: axis.map((d) => d.toISOString().slice(11, 16)), values: series[0]?.points ?? [] }
}

describe("hourly buckets across DST changes (Europe/Luxembourg)", () => {
  it("keeps 01:00Z on the autumn change night and separates the two readings", () => {
    const { axis, values } = hourly("2026-10-24T22:00:00Z", "2026-10-25T03:00:00Z", ["2026-10-25T00:30:00Z", "2026-10-25T01:30:00Z"])
    expect(axis).toEqual(["22:00", "23:00", "00:00", "01:00", "02:00", "03:00"])
    expect(values).toEqual([null, null, 1, 2, null, null])
  })

  it("has one bucket per hour on the spring change night", () => {
    const { axis, values } = hourly("2026-03-28T23:00:00Z", "2026-03-29T03:00:00Z", ["2026-03-29T00:30:00Z", "2026-03-29T01:30:00Z"])
    expect(axis).toEqual(["23:00", "00:00", "01:00", "02:00", "03:00"])
    expect(values).toEqual([null, 1, 2, null, null])
  })
})

describe("bucketTrend", () => {
  it("averages readings in the unit that share a bucket, and keeps stations apart", () => {
    const window = { from: utc("2026-11-07T23:00:00Z"), to: utc("2026-11-08T22:59:00Z") }
    const other: AirQualityStation = { ...station, id: 2 }
    const { axis, series } = bucketTrend(
      [
        {
          station,
          points: [
            { at: utc("2026-11-08T01:00:00Z"), value: 10, unit: "µg/m³" },
            { at: utc("2026-11-08T20:00:00Z"), value: 20, unit: "µg/m³" },
            { at: utc("2026-11-08T21:00:00Z"), value: 0.5, unit: "ppm" },
          ],
        },
        { station: other, points: [] },
      ],
      "µg/m³",
      "day",
      window,
    )
    expect(axis.map((d) => d.toISOString())).toEqual(["2026-11-07T23:00:00.000Z"])
    expect(series).toEqual([
      { stationId: 1, points: [15] },
      { stationId: 2, points: [null] },
    ])
  })

  it("finds each reading's bucket in the axis, since a zone-aware bucket per reading takes ~1 s on a year of nine stations", () => {
    const window = { from: at("2026-11-01T00:00:00Z"), to: at("2026-11-08T00:00:00Z") }
    const points = Array.from({ length: 24 * 7 }, (_, h) => ({ at: new Date(window.from.getTime() + h * HOUR), value: 1, unit: "u" }))
    const stations = (n: number) => Array.from({ length: n }, (_, id) => ({ station: { ...station, id }, points }))
    const zonedDatesFor = (n: number) => {
      zonedDatesBuilt.count = 0
      bucketTrend(stations(n), "u", "day", window)
      return zonedDatesBuilt.count
    }
    expect(zonedDatesFor(3)).toBe(zonedDatesFor(1))
  })

  it("leaves out readings outside the window", () => {
    expect(hourly("2026-11-08T10:00:00Z", "2026-11-08T11:00:00Z", ["2026-11-08T09:59:00Z", "2026-11-08T11:01:00Z"]).values).toEqual([null, null])
  })
})

const wholeHourIn2026OftenNearDst = fc.oneof(
  fc.integer({ min: 0, max: 365 * 24 }).map((h) => Date.UTC(2026, 0, 1) + h * HOUR),
  fc.constantFrom(Date.UTC(2026, 2, 28, 20), Date.UTC(2026, 9, 24, 20)),
)

describe("hourly bucketing properties", () => {
  it("has one axis entry per hour in the window, both ends included", () => {
    fc.assert(
      fc.property(wholeHourIn2026OftenNearDst, fc.integer({ min: 0, max: 72 }), (from, hours) => {
        const { axis } = hourly(new Date(from).toISOString(), new Date(from + hours * HOUR).toISOString())
        expect(axis).toHaveLength(hours + 1)
      }),
    )
  })

  it("puts every point in exactly one bucket", () => {
    fc.assert(
      fc.property(wholeHourIn2026OftenNearDst, fc.integer({ min: 0, max: 48 * 60 - 1 }), (from, minute) => {
        const at = new Date(from + minute * 60 * 1000).toISOString()
        const { values } = hourly(new Date(from).toISOString(), new Date(from + 48 * HOUR).toISOString(), [at])
        expect(values.filter((v) => v !== null)).toEqual([1])
        expect(values.indexOf(1)).toBe(Math.floor(minute / 60))
      }),
    )
  })
})

describe("bucketTrend on real Esch NO2 readings", () => {
  beforeAll(stubFetchWithFixtures)

  const filled = (axis: Date[], points: (number | null)[] | undefined) =>
    axis.flatMap((d, i) => (points?.[i] == null ? [] : [d.toISOString()]))

  it("buckets the day range hourly, with values up to the last reading", async () => {
    const { history, from, to } = await eschNo2History(1)
    const { axis, series } = bucketTrend(history, "µg/m³", "hour", { from, to })
    expect(axis).toHaveLength(25)
    expect(series[0]?.points[0]).toBe(13.1)
    const hours = filled(axis, series[0]?.points)
    expect([hours.length, hours.at(0), hours.at(-1)]).toEqual([11, "2026-11-07T12:00:00.000Z", "2026-11-07T22:00:00.000Z"])
  })

  it("buckets the week range by Luxembourg day", async () => {
    const { history, from, to } = await eschNo2History(7)
    const { axis, series } = bucketTrend(history, "µg/m³", "day", { from, to })
    expect(axis.map(iso)).toEqual([
      "2026-10-31T23:00:00.000Z", "2026-11-01T23:00:00.000Z", "2026-11-02T23:00:00.000Z", "2026-11-03T23:00:00.000Z",
      "2026-11-04T23:00:00.000Z", "2026-11-05T23:00:00.000Z", "2026-11-06T23:00:00.000Z", "2026-11-07T23:00:00.000Z",
    ])
    expect(series[0]?.points.map((p) => (p === null ? null : Number(p.toFixed(2))))).toEqual([null, null, null, null, 22.91, 27.55, 16.78, null])
  })
})
