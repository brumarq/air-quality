// path: features/heat/fixture.ts
// expect: clean
import { getHeatYears } from "@/domain/heat"
import { addHeatGridLayer } from "./heat-layers"
export const x = [getHeatYears, addHeatGridLayer]
