// path: features/heat/fixture.ts
// expect: @eslint-community/eslint-comments/no-restricted-disable
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy payload
export const parse = (raw: string): any => JSON.parse(raw)
