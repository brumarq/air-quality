// path: domain/fixture.ts
// expect: clean
export const nextHour = (d: Date) => new Date(d.getTime() + 3_600_000)
export const epoch = new Date(Date.UTC(2026, 0, 1))
