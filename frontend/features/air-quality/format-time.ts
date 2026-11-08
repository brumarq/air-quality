import { LUXEMBOURG_TIME_ZONE } from "@/domain/shared/time"

// Readings are shown in Luxembourg time, whatever the viewer's own zone. The date and
// number format stays the viewer's locale.

export const formatReadingTime = (at: Date) => at.toLocaleString(undefined, { timeZone: LUXEMBOURG_TIME_ZONE })

export const formatDataSince = (at: Date) =>
  at.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: LUXEMBOURG_TIME_ZONE })
