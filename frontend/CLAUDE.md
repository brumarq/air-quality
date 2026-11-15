# Frontend (LuxAir)

Next.js 15 app router, React 19, Mapbox GL 3, Tailwind 3 + shadcn, Recharts, zod.

## Commands (from `frontend/`)
- `npm run dev`: dev server on :3000. Don't run `npm run build` while it's up (it shares `.next`).
- `npm run check`: typecheck, lint, Vitest (in `TZ=Europe/Luxembourg`, so DST bugs show up even on UTC CI machines; `test/zone-independence.test.ts`
  reruns time code in other zones). Must pass before every commit.
- `npm run e2e`: Playwright smoke tests against a fixture backend; builds into `.next-e2e`, so it's safe next to `dev`.

## Structure
```
app/            routes; _components/ is the page shell (layout, mode switch, header, cross-feature callout)
content/        one plain-data file per area; content/area.ts is their type
features/<x>/   api.ts, model.ts, map.ts, use-<x>-mode.ts, one .tsx per card or panel, and a <file>.test.ts(x) beside each
shared/         used by 2+ features: domain/ (limits, geo), lib/ (useAsync, cn, static-data, numbers), map/ (useMapLayer), theme/tokens.ts (the only place colour values live; Tailwind, Recharts and Mapbox read it), ui/ (shadcn, StatusCard)
```
Each feature has api.ts, model.ts, map.ts, use-<feature>-mode.ts and one file per card or panel, leaving out any it doesn't
need. model.ts (and its topic splits) holds types, calculations, and the labels and colours more than one file uses: no
Intl, no `toLocale…`, no reading the clock. Small helpers and child components live in the file that uses them. Split a
file by topic only when it passes ~300 lines (air-quality has `time.ts`).

Imports flow `shared → features → content → app`, and no feature imports another. Features take explicit
values (slug, flags, `studyOverlay`), never an `Area`. One lint rule enforces this (`import/no-restricted-paths`).

Other lint rules: TS strict, promise and unsafe-`any` checks, no `!`, exhaustive switches (a `default:` doesn't
count, so a new union member is flagged), Tailwind's unknown-class check (an unknown class renders as nothing),
no nested components (they remount on every render), no disabling `react-hooks/*` or `@typescript-eslint/*` (that
hides real bugs; any other disable must say why). Don't add lint rules for style or conventions; propose one only
for a bug that has happened twice and fails silently.

Times: the backend returns zoneless UTC strings; each `api.ts` turns them into `Date`. Bucket with
`features/air-quality/time.ts` and display in Europe/Luxembourg. Every async load is `loading | error | ready` via `useAsync`.

## Adding things
- **A commune**: `content/communes/<slug>.ts` + one line in `content/communes/index.ts`, and its files in `public/data/<slug>/`.
- **A feature**: a folder in `features/`, combined with the others in `app/_components/map-container.tsx`.
- **Within a feature**: a card or panel is one component file with a test beside it (e.g. `rankSensitiveBuildings` in
  `features/heat/heat-story-panel.tsx`). A map layer is one `useMapLayer` config in `map.ts`; copy `features/heat/map.ts`.
  A time range is one key in `RANGE_KEYS` (`features/air-quality/model.ts`).

## Showing numbers
- Every measured or computed value goes through numbers.ts. Years and small counts are
  shown as they are. Components never call toFixed, toLocaleString or Intl themselves.
- One function per quantity (formatCelsius, formatConcentration, …). A new quantity
  gets a new function in the same style. No options parameters, no generic
  formatNumber.
- Missing values show as MISSING ("—"). A sentence that needs "no data" checks for
  null itself.

## Components
- A component takes domain data and renders it. No view-model types and no
  pre-formatted strings passed in.
- Calculations over the data are plain functions in the component's file, or in
  model.ts if another file uses them.
- Don't name files after a kind of code (format, utils, helpers).

## Before writing logic
Stop at the first yes:
1. Does the product need it? If code only exists to make things match or look
   slightly nicer, ask first.
2. Does the platform do it? Intl, CSS, Mapbox expressions, zod.
3. Does a dependency in package.json do it?
4. Is there a small, well-known library? Ask before adding it.
5. Only then write it, so that each line can be understood without working it out.
   Name intermediate steps.

## Writing it
- No bit operations, no chained string tricks, no expressions that only make sense
  once you've traced them. Prefer three plain lines to one clever one.
- No comments. Make the code clear through names. When code must stay in a form
  that looks wrong or replaceable, protect it with a test whose name says why.
  Product decisions go in 'Domain decisions' below.

## Derived numbers
The heat and NO₂ data are static files made by scripts/. A number derived only from
them belongs in the script's output, not in frontend code. Propose moving it, don't
add it to the frontend.

## Domain decisions
- The national view outlines Luxembourg's bounding box as a plain rectangle, for
  orientation. It isn't the country border.
- Esch's study overlay is Geoportail's public WMS layer 2922, the PRO-SUD daytime heat map
  (2923 is the night one). It was picked because it's public, allows CORS and serves EPSG:3857.
- EU limits are annual means, so every shorter period carries a note that its value is
  indicative only. The Year period is a rolling 12 months, not a calendar year.
- Every period is a rolling window ending now (Day is the last 24 hours, not since midnight),
  so all periods work the same way.
- Live uses the Day window but shows each station's latest hourly value instead of the
  average, and the trend chart marks that value.
- A station's bar runs to 125% of today's limit, so a reading just over the limit still
  shows how far over it is.
- "Hottest 10%" leaves out private industrial land (e.g. an active steel plant). It reads
  hottest of all, but the commune can't act on it, and including it pushed school hotspots
  out of the set. The pipeline still writes the industrial maximum to stats.json, and the app doesn't show it.
- A cell's anomaly is its surface temperature minus that summer's commune-wide mean. It's a
  comparison within the commune, not an absolute heat-risk rating.
- NDVI is drawn on the same 100m cells as heat. The pipeline averages Sentinel-2's 10m pixels into them.
- The commune boundary shows whenever heat mode is on. It's for orientation, so it has no switch.
- Heat grid and buildings start switched on. NDVI and the study overlay start off, to avoid clutter.
- The heat legend shows the anomaly stops as equal swatches, not to scale.
- The study's named spots are a list of names in two groups (hot, cool), not a dot strip,
  because officers recognise places by name. Each row has a temperature bar and flies the map there.
- A study overlay needs a public WMS 1.3.0 endpoint that serves EPSG:3857 PNG tiles with CORS.
- The NO₂ tube card shows the yearly cut each site needs to reach the 2030 value, plus its
  change from the year before. It doesn't fit a trend line: 5-8 noisy annual points would
  claim more certainty than the data has.
- NO₂ tube colours follow the Pacte Climat report's own bands (e.g. the 2023 report, fig. 3):
  red above today's limit, orange above the 2030 value, green above the WHO guideline, blue at or below it.
- A tube source's report title, URL and page aren't shown, so only its year is read.
- Limits are annual means. `limitToday` is Directive 2008/50/EC, `limit2030` is Directive (EU) 2024/2881,
  and WHO_NO2_GUIDELINE is the WHO 2021 annual NO₂ guideline.
- All copy is English, so numbers and dates use one fixed locale (en-GB), not the browser's.
- A station keeps one colour, picked by its place in the area's list, across bars, chart and legend.
  The colours are meant to be cool so they don't read as limit colours, but entries 4-6
  (fuchsia, pink, rose) are warm and sit close to the red 2030 line on the nine-station view.
- A cell without an NDVI value is drawn in the lowest NDVI colour.
