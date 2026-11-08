// path: domain/fixture.ts
// expect: no-restricted-globals
export const latestValue = (values: number[]) => values.at(-1) ?? NaN
