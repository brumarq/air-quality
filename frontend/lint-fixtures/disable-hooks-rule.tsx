// path: features/heat/use-fixture.ts
// expect: @eslint-community/eslint-comments/no-restricted-disable
import { useEffect } from "react"
export function useFixture(value: number) {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- value is applied elsewhere
  useEffect(() => console.info(value), [])
}
