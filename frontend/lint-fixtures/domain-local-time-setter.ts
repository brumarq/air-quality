// path: domain/fixture.ts
// expect: no-restricted-syntax
export const startOfDay = (d: Date) => {
  const r = new Date(d.getTime())
  r.setHours(0, 0, 0, 0)
  return r
}
