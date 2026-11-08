// path: features/heat/fixture.tsx
// expect: no-restricted-syntax
export function Total({ values }: { values: number[] }) {
  let sum = 0
  for (const v of values) sum += v
  return <span>{sum}</span>
}
