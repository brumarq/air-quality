// path: features/air-quality/fixture.ts
// expect: clean
import { summarizeStation } from "@/domain/air-quality"
import { TIME_RANGES } from "@/domain/air-quality/time-ranges"
import { windowEndingAt } from "@/domain/shared/time"
import { POLLUTANT_LIMITS } from "@/domain/limits"
export const x = [summarizeStation, TIME_RANGES, windowEndingAt, POLLUTANT_LIMITS]
