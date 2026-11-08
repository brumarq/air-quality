// Fails the whole run if the zone override above didn't reach the test workers.
const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
if (zone !== "Europe/Luxembourg") {
  throw new Error(`Tests must run with TZ=Europe/Luxembourg, got ${zone}`)
}
