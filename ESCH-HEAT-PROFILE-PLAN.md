# Esch-sur-Alzette Air & Heat Profile: MVP Plan

Oct 23, 2026 · @Bruno

## Goal

Build one working page for Esch-sur-Alzette that shows a commune officer their own air quality and heat data, and use it in real conversations to find out whether they would use it and pay for it.

The page is a conversation tool, not the product yet. It lives inside your existing LuxAir app as a new page, so you are not starting a new app.

The one question the MVP must answer: **would an environment officer or climate advisor use this in their Pacte Climat work, and would their commune pay for it?** If nobody reacts that way, you have learned it cheaply and can change direction.

## What the page does

An officer opens the Esch-sur-Alzette page and sees four things, top to bottom:

1. **Air quality now.** The latest readings for NO₂, PM2.5 and PM10 from the two Esch stations (Esch/Alzette and Esch Gare), each shown next to today's EU limit and the stricter 2030 limit. Every reading shows its timestamp.
2. **Air quality over time.** A trend chart per pollutant, with the same two limit lines drawn across it, so it is obvious how far from the 2030 limit the commune sits.
3. **Summer heat.** The PRO-SUD region's own 2024 bioclimatic study, pulled in live, plus a satellite layer showing what's been observed each summer since — anomaly, not absolute degrees — with vegetation and vulnerable-site overlays. See the revised Step 3.
4. **A report to take away.** One button that downloads the numbers as a CSV, and later a PDF, that the officer can attach to a Pacte Climat file.

Every number says where it came from. Anything that is only an example is labelled as such on the page itself.

## Who it is for

The user is the environment officer or climate advisor (conseiller climat) of a commune, someone who prepares Pacte Climat evidence and reports to the mayor and council. Climate advisor firms are a second audience, because one advisor serves many communes.

It is not for citizens. Meng Loft, the official app of the Administration de l'environnement, already covers them for free.

## What is real and what is not

Only the live readings are real today; everything else needs a small piece of work, and the Pacte Climat tube data has no known source yet.

| Feature | Data source | Status | Catch |
| --- | --- | --- | --- |
| Live readings | OpenAQ via your collector; two EEA reference-grade stations in Esch | Real, built | Esch Gare reports NO and NO₂ only; NO sometimes has no recent reading |
| Limit lines | EU Directive 2008/50/EC (today) and 2024/2881 (2030) | Real | Values need a final check against the directive text |
| Trend chart | Your database, through a new history endpoint | Real, built | History only goes back to when your collector started storing it |
| Heat map | PRO-SUD study (live WMS, confirmed public) + Landsat 8/9, free | PRO-SUD layer real today, no build needed; Landsat layer scoped as revised Step 3 | Landsat is coarse (~100 m) and cloud-limited; PRO-SUD is a modelled one-day snapshot, not observed data |
| Pacte Climat NO₂ tube results | Climate Pact measurement campaign | Real, pulled 2026-10-26; build scoped as Step 2.5 | Indicative, not a compliance measurement; one-off PDF extraction, no API |
| Report download | Built from the data above | Real once built | Only as complete as the data behind it |

## Build steps

Four steps after the data check, each small enough for one or two weeks of evenings. Each one ends with something you can show someone.

### Step 0: Check the data (done)

Both Esch stations, Esch/Alzette and Esch Gare, reach your app through the collector.

### Step 1: Live readings page (done)

- Built as a commune page under `frontend/app/`, driven by `data/communes.ts` rather than being Esch-only, so the same page works for any commune by config.
- Shows NO₂, PM2.5 and PM10 with value, timestamp and a limit bar (`station-limit-bar.tsx`) marking today's and the 2030 limit.
- 2026-10-26: the whole map page was redesigned from a collapsible sidebar to floating "island" cards over a full-bleed Mapbox map (commit `ca4efa2`) — `components/sidebar/*` is gone. The commune switcher now lives in `CommuneHeaderCard`'s dropdown, and there's an air-quality/summer-heat mode toggle in the same card, which Step 3's heat layer will plug into.
- **Done when:** the page shows real Esch values with timestamps and nothing misleading when a station has gaps. ✓

### Step 2: History and trend chart (done)

- Backend history endpoint built, `getSensorReadings` filled in, chart drawn with Recharts showing real averages with the two limit lines.
- **Done when:** the chart shows real averages for the days collected so far. ✓

### Step 2.5: NO₂ tube overlay and reduction-needed card — build this first (decided 2026-10-27)

No longer deferred (revised 2026-10-26) — the tube data is a stronger pitch asset than first treated: four points with eight years of history each, sourced from the commune's own Pacte Climat reports, is a better story than a second live station would have been.

**Framing corrections, applied after review — important before this goes in front of an officer:**
- Boulevard Kennedy did **not** simply "halve." 52 (2018) → 36 (2020) is a ~31% drop over two years; 52 → 27 (2025) is ~48% over the full seven. Say "down ~30% in its first two years, roughly half since 2018" — not "halved."
- Don't attribute the drop to Covid or vehicle turnover, and don't call the site "fixed." The commune may credit its own traffic measures, and guessing wrong in a first contact is a bad look. Kennedy is also still 35% above the 2030 value, so "fixed" undersells the actual point. Say "back under today's limit since 2020, still above 2030's."
- Treat tube results as **indicative measurements**, which is how the AEV's own reports treat them (the uncertainty-corrected figure, not a pass/fail). Say "distance to the 2030 value," never "non-compliant" — formal compliance is assessed at the official reference stations, not the tubes.

**The card that does the actual work:** don't fit a trend line through 5–8 points — it swings wildly depending on the window. Show the reduction each site needs per year to reach the 2030 value of 20, plus last year's change. That's robust, and it's the officer's real question.

| Tube | 2025 | vs 2030 value (20) | Needed per year to 2030 | Last year's change |
| --- | --- | --- | --- | --- |
| bd Kennedy | 27 | +35% | −1.4/yr | 0 |
| rue de Luxembourg | 22 | +10% | −0.4/yr | +1 |
| Neudorf | 23 | +15% | −0.6/yr | −1 |
| rue A. Useldinger | 16 | −20% | already below | +2 |

Headline this produces: "Three of Esch's four NO₂ sites are above the 2030 value. Kennedy needs to fall 1.4 µg/m³ a year to get there, and it hasn't moved since 2024." That's a sentence an officer can repeat in a meeting.

**Build:**
- ✅ Data as a static file, `frontend/data/no2-tubes/esch.json`, with the source PDF title/URL and exact page cited per year (verified via `pdftotext`, not guessed) — not just the dataset as a whole.
- ✅ Map: four tube pins (`lib/utils/no2-tube-map-utils.ts`, `hooks/use-no2-tube-markers.ts`), colored by latest value against the limits (reusing the official report's red/orange/green/blue scheme — `getTubeColor` in `lib/no2-tubes.ts`). Clicking a pin or a row in the reduction card shows the 8-year sparkline (`NO2TubeDetailCard`) with both limit lines. Neudorf's card carries the "approximate location" note.
- ✅ Card: the reduction-needed table (`NO2ReductionCard`), computed from the data file via `getReductionNeeded()`, never hand-typed. Wired into the air-mode left column in `map-container.tsx`, gated on the commune having a tube dataset (Esch only, today).
- ✅ **Station backfill, done 2026-11-08 — better than planned.** Instead of hunting for a PDF-sourced PM2.5 summary, backfilled real hourly history straight from OpenAQ into the app's own database: `openaq-collector/cmd/backfill/main.go`, a reusable one-off tool (`go run ./cmd/backfill --location 9650 --from 2025-01-01`) that pulls `GET /v3/sensors/{id}/hours` from OpenAQ for every sensor at a location and inserts into Postgres `sensor_readings` with `ON CONFLICT DO NOTHING` — no backend/Kafka changes needed, since `sensors.sensor_id` already *is* the raw OpenAQ sensor ID. Ran for Esch/Alzette (location 9650): **63,047 new rows** across all 7 pollutants (NO₂, CO, O₃, PM2.5, PM10, SO₂, NO), 2025-01-01 to today — up from 112 rows total before. Verified live in the app's own trend chart, not just in Postgres. Reusable as-is for the collector's other 8 hardcoded locations, not yet run for them.
- **Done when:** air mode shows the four tubes with history (✓), the reduction-needed card (✓), and the station's multi-year history for all pollutants, not just PM2.5 (✓, exceeds original scope) — all regenerated from data files or the database, nothing hand-typed into the UI.

**Forward note, resolved 2026-11-08 — both layers exist now.** Added "Where air and heat meet" to `heat-story-panel.tsx`: boulevard Kennedy is one of the PRO-SUD study's named heat hotspots *and* still +35% above the 2030 NO₂ value — the only spot where the Step 2.5 and Step 3 datasets independently agree, and the only claim on the page spanning both air and heat. Worded deliberately as "the study names it," not "satellite confirms it's hot": on the satellite record Kennedy was the mildest of the five named hotspots, only 0.45°C above the warmest spot the study calls "cool" - the heat claim rides on the study's naming, not on satellite-observed severity, and the card says so.

### Step 3: Summer heat map — revised 2026-10-27, build on the PRO-SUD study (after Step 2.5)

**The pitch decides the build.** *"Your 2024 study modelled one hot day. Here's what satellites actually saw in Esch every summer since, where it matches the study, and which schools and care homes sit in the hottest spots."* One commune (Esch — the study's own worked example throughout, lean into that), one page, ends with a link sent in an email.

**The plan changed because of a real gap, not a preference.** On 2024-10-22, Luxembourg's housing minister and the mayor of Esch-sur-Alzette (who chairs PRO-SUD) presented the "Stadtklimaanalyse für die Region PRO-SUD" — a bioclimatic study by GEO-NET and LIST covering all 11 PRO-SUD municipalities, including both Esch and Dudelange, at 5×5m resolution, with current-state and 2031–2060 (RCP4.5) projections. Showing an officer a homemade Landsat map that ignores the study their own mayor launched is a credibility risk — "how does this compare to ours?" is the first question. The reframe: don't compete with their study, extend it. Their map is a one-off modelled snapshot; this page is the living layer on top — what's been observed since, where it overlaps with vulnerable people, and (eventually, pending their data) where their own proposed measures apply.

**The study itself, read 2026-10-27** ("Bioklima Analyse für die ProSud Region," GEO-NET + LIST, Endbericht/final report, Belvaux, June 2024, 122 pages, PDF at [minett-biosphere.com](https://minett-biosphere.com/wp-content/uploads/2024/10/Bioklima-Analyse-Region-PRO-SUD.pdf)):
- **Esch is literally the study's own worked example** — nearly every figure and result uses Esch, Dudelange barely appears.
- Simulation (FITNAH-3D, 5m grid, 31×25km domain), not satellite — one idealised calm/clear/hot summer day, read at **04:00 air temperature** (sleep-relevant) and **14:00 PET** (felt heat: temperature + humidity + wind + radiation). Futures: 2031–2060, +0.7°C ("weak") and +2.7°C ("strong") on RCP4.5.
- **They already use anomaly/z-score classification**, not absolute degrees — independently confirms the anomaly approach below is the right call, not an invented convention (absolute values "only hold for that one simulated day," in their own words).
- Esch hotspots named in the study: the dense centre (Rue Zénon Bernard), the Esch-Schifflange industrial site, unshaded car parks at An der Schmelz, the town hall square, and **boulevard Kennedy** — the same street as the Step 2.5 NO₂ hotspot tube. Cool spots named: Parc Laval, Park Clair-Chêne, the Brucherbierg-Lalléngerbierg edge.
- Daytime PET at the Esch town hall square reaches 41–43°C now, 44–46°C in the "strong" future scenario. Region-wide, land rated high/very-high heat stress grows from 3.5%→80% (night) and 8.5%→60% (day) between today and the "strong" scenario.
- They ran their own 1-year ground-truth check: 6 sensors (June 2023–May 2024) including one on boulevard JFK and one in Ellergronn as a rural baseline, up to 5.3°C apart in a given hour; a LIST measurement car found up to 4°C difference driving through at night.
- **The catalogue is 20 measures (M01–M20)** in three groups: outdoor comfort (M01–M10), night ventilation (M11–M14), indoor heat (M15–M20). Two findings worth repeating to an officer: most outdoor measures help by day but barely at night (water/trees can even keep nights slightly warmer), and **green roofs don't measurably cool the street** — night heat is mostly a building-retrofit and airflow problem, not a greening one.
- **The real gap this page fills, in the study's own words:** it's one simulated day, meant to be redone only every 5–10 years — nothing tracks actual summer-to-summer change; only 6 ground-truth points exist for a whole year; environmental justice (who actually lives in the hot zones) is named as a possible use but never mapped; and the full dataset (18,000+ areas, ~50 attributes each, 5m GeoTIFFs) is locked inside an ArcGIS system for planners, not something a council member or resident can open.

**Data access, settled 2026-10-27 — confirmed by directly clicking the published layers, not just reading metadata:**
- Raw PRO-SUD GIS data (shapefiles/GeoTIFFs) is **not downloadable anywhere** — not data.public.lu, geoportail.lu, minett-biosphere.com, prosud.lu or list.lu. Only published as WMS/web-map layers.
- **The published evaluation layers (2922 day, 2923 night) are not queryable.** Tested directly: clicking a rated area on the live geoportail viewer does nothing — no GetFeatureInfo popup, no per-area score. So the click popup in Week 2 cannot show "the study rates this area X" from their layer directly; that line has to come from hand-placed annotations sourced from the report text (the named hotspots/corridors already listed above), not a live query. This also sharpens the Week 4 ask: "the public layers show the map, but not the per-area ratings — can we get the shapefile."
- **The actual action-priority map (Planungshinweiskarte) is not confirmed public.** Record `136ac54a-ed35-43e1-8c01-6a26397273b9` was initially assumed to be it but is actually "Temperature and cold air volumetric flow density" — a different layer. Worth a 2-minute check at build time: browse geoportail.lu's catalogue under Urban planning → Regional → South Region → Climate analysis maps, looking for something named Planungshinweiskarte / carte indicative de planification / Handlungspriorität. If it's not there, the action-priority classification stays locked in PRO-SUD's ArcGIS system, which only strengthens the Week 4 ask.
- A third layer exists and is confirmed real: **`LAYERS=2920`, "Cold air streams"** (point data — location + wind direction of cold-air corridors, inflows, park winds). Optional addition to the WMS toggle set alongside 2922/2923, not required for the MVP.
- **Attribution required** if embedding these WMS layers: "© Administration du Cadastre et de la Topographie / Geoportail.lu," standard geoportail.lu terms — add this credit line wherever the PRO-SUD layer is shown.
- The 2021 national study's GIS ZIP fallback is confirmed real and downloadable (Open Data Licence Luxembourg), 25m resolution (not 10–25m as an earlier unverified claim had it) — still the right fallback if the WMS layers ever go away.

**Week 0 — one check before building anything (one evening), narrowed by the above:**
- ✅ **Do the WMS tiles actually render inside Mapbox GL specifically — checked 2026-11-08, yes.** `wms.geoportail.lu/public_map_layers/service` returns `access-control-allow-origin: *` and lists `EPSG:3857` as a supported CRS (checked via `GetCapabilities`), so a Mapbox GL raster source using the `{bbox-epsg-3857}` URL-template trick (`tiles: ["https://wms.geoportail.lu/public_map_layers/service?...&BBOX={bbox-epsg-3857}&..."]`) should work. Built a real test page (Mapbox GL JS 3.18.1, layer 2922, centered on Esch) and rendered it headless (`chromium --headless --dump-dom`) rather than trusting a bare `curl`, since that was the specific risk this check was for — confirmed `TILES LOADED OK`, real `GetMap` requests fired with correctly-computed per-tile BBOXes, no CORS/projection error. Proceed as planned: swipe-compare against the satellite layer in Week 2.
- ✅ **"Does Landsat agree with the study's named hotspots?" — checked 2026-11-08, answer: yes, cleanly.** `scripts/check_landsat_vs_prosud.py` (Earth Engine, project `air-quality-451910`, venv at `scripts/.venv-gee`): Landsat 8+9 Collection 2 Level-2 surface temperature, cloud-masked, summer (Jun-Aug) 2022-2025 median composite, sampled at all 8 named points from the study (5 hot: Rue Zénon Bernard, Esch-Schifflange industrial site, An der Schmelz, the town hall square, boulevard Kennedy — the last geocoded earlier for the NO2 tubes, reused here; 3 cool: Parc Laval, Park Clair-Chêne, the Brucherbierg-Lalléngerbierg edge; all geocoded via Nominatim). Ranked by observed °C, **all 5 hot-labeled points sit strictly above all 3 cool-labeled points** — lowest hot (Kennedy, 36.96°C) beats the highest cool (Park Clair-Chêne, 36.51°C) by 0.45°C, with no overlap. (First pass compared each point's anomaly against the box-wide mean and got a misleading 5/8 — the box included surrounding farmland, naturally cooler than anywhere in town, hot or cool spot alike. Ranking the points directly against each other, not against that mean, is the right test and the one that matters for Week 3's "study vs. satellite" callouts.) This was the step's single highest-risk unknown — it's resolved, proceed with the build.
- **Explicitly not needed for the MVP, a later stretch idea:** reading the WMS tile's rendered pixel color at a clicked point and mapping it back to the legend's classes, to approximate "the study rates this area: high" without their data. Only works if the tiles allow canvas reads (CORS, again), and would need labelling as "read from the published map" rather than an authoritative rating. Interesting, not now.

**Week 1 — data, no backend changes — done 2026-11-08:**
- `scripts/build_esch_heat_grid.py` (venv: `scripts/.venv-gee`, same EE project `air-quality-451910` as the Week 0 check). 100m grid over Esch's real commune boundary (1,483 cells for 14.35 km² — built in EPSG:2169, Luxembourg's own local projection; a first attempt in EPSG:3857/Web Mercator came out at 3,487 cells because Mercator inflates distances by `1/cos(latitude)` ≈1.54x this far from the equator, worth remembering for any future Luxembourg-specific geometry work). Per year (2022-2025): summer (Jun-Aug) Landsat 8+9 median surface temp (absolute °C + anomaly vs. that year's actual commune-boundary mean, not a wider box — the Week 0 check's own mistake, fixed here) and Sentinel-2 NDVI at its native 10m, both reduced to the 100m cells.
- Esch boundary from the ACT's own dataset on data.public.lu (`communes4326.geojson`, LAU2 `0204`) — the real administrative polygon, not a bounding box. Sensitive buildings (25 found: schools, kindergartens, one care-home search came up empty for Esch specifically) from OSM Overpass, point locations.
- Stats computed per year: commune mean, hottest-10%-of-cells threshold (by anomaly) and count (~149-150 cells/year), which sensitive buildings fall nearest a hottest-10% cell. **Lycée Guillaume Kroll lands in the hottest 10% in 2023 and 2025 but not 2022/2024** — a real summer-to-summer signal, worth a Week 3 callout.
- Output: `frontend/public/data/esch/{heat-grid,boundary,sensitive-buildings}.geojson` + `stats.json`. Written, not yet committed to git.

**Week 2 — the map — first pass done 2026-11-08:**
- ✅ Heat grid as a vector fill layer (`lib/utils/heat-map-utils.ts`, `hooks/use-heat-map-layers.ts`), diverging ramp (`anomalyFillExpression` in `lib/heat-map.ts`), year toggle reusing the existing `ToggleGroup` pattern (`components/communes/heat-map-card.tsx`).
- ✅ Hover highlight (feature-state, via `promoteId` on the grid source) and click — but as a **side-panel detail card**, not an on-map popup, to match the NO2-tube click→detail→back pattern already established in Step 2.5 rather than introducing a second UX convention. Shows anomaly, absolute °C, NDVI, and a 4-year bar chart (`components/communes/heat-detail-card.tsx`). Scene-level acquisition dates aren't in the Week 1 data (only the year-level composite is) — the card says "median of cloud-free Landsat 8/9 scenes, June-August {year}" instead of listing individual dates; revisit if an officer actually asks for more precision.
- ✅ Layer toggles: satellite heat, NDVI, sensitive buildings, PRO-SUD study map (WMS) — independent switches, each its own source/layer pair, all confirmed working with zero console errors in a real headless-browser run (`puppeteer-core` against the actual dev server, not just `tsc`).
- ✅ Click a sensitive building: shows its nearest grid cell's anomaly and whether that cell is in the year's hottest 10%.
- ❌ **Swipe-compare widget: tried 2026-11-08, abandoned.** Built it (`mapbox-gl-compare`, two independent Mapbox GL instances in one component) and hit a real bug: the second ("PRO-SUD") map's canvas never composited onto the page - fully transparent, confirmed by swapping the page background color and watching it show through. Ruled out, in order: the library's legacy `clip` CSS property (real bug, fixed - it doesn't reliably clip a WebGL canvas, switched to `clip-path` with a `MutationObserver` mirroring the library's own updates), the heavy `standard` map style (switched to `light-v11`, no change), a WebGL context limit (all 3 canvases report valid, non-lost contexts), a stale first paint (forced `.resize()`/`.jumpTo()`, no change), and `clip-path` itself (removed entirely, still transparent). The map's own internal state was always correct - loaded, right layers, right source - it just never visually painted. **User confirmed the same failure in their own real browser**, ruling out a headless-sandbox-only artifact. Root cause not found before time was called on it. Reverted cleanly (`mapbox-gl-compare` uninstalled, `heat-compare-view.tsx` deleted, the "Swipe-compare" button and its wiring removed from `heat-map-card.tsx`/`map-container.tsx`) - **not worth more effort**: the 4 independent layer toggles already let an officer switch between the satellite layer and the PRO-SUD layer on one map and compare by eye, which is the actual point: the dedicated slider would only have been a polish layer on top of a comparison that already works.

**Week 3 — the story panel — done 2026-11-08:**
- ✅ `components/communes/heat-story-panel.tsx`, right column, visible in heat mode (mirrors where `PollutantTrendChart` sits in air mode). Everything on it is computed from the real data files, nothing hand-typed into JSX - including the headline sentence's number.
- ✅ Headline: dynamically finds the single hottest grid cell for the latest year and states its anomaly. Currently reads "Esch-sur-Alzette's hottest 100m patches ran up to 16.3°C above the commune average in 2025 — a gap that's shown up every summer since 2022, not a one-off" (that's ArcelorMittal Belval - see the 49.8°C conversation above).
- ✅ 4 stat cards, real numbers, not the plan's illustrative "4 schools and 2 care homes" guess: hottest-spot anomaly for the selected year, summer-to-summer swing in the commune mean (2.8°C across 2022-2025), sensitive buildings tracked (28: 21 schools, 4 kindergartens, 3 care facilities), and how many buildings have ever landed in a hottest-10% cell (2 of 28 - Lycée Guillaume Kroll, 2 of 4 summers; **Espace Garage Dicks, 4 of 4 summers** - a social facility sitting in the hottest 10% every single year measured, not a one-off).
  - **Care-home tagging gap, caught and fixed 2026-11-08.** First pass queried only `social_facility=nursing_home` and found zero, which the card then stated as "no care homes found in OSM for this commune" - a number a local reading it would immediately know was wrong (Esch has care facilities). Widened the Overpass query (`social_facility~"nursing_home|assisted_living|group_home"`, plus `amenity=nursing_home`, `amenity=social_facility`, `healthcare=nursing_home`) and found 3 real ones: Résidence Op der Léier (assisted living), Centre d'Education différenciée (group home), Espace Garage Dicks (social facility). Renamed the category from `nursing_home` to `care_facility` throughout (data pipeline, types, map colors, card copy) since OSM's own subtype split (nursing/assisted-living/group-home) doesn't matter for this page's purpose - only "vulnerable people live here" does. The card's logic was also changed to omit the care-facility line entirely if a future commune genuinely has zero, rather than assert a zero a local could flag as wrong.
- ✅ Study-vs-satellite callout: added `study-comparison.json` output to `scripts/check_landsat_vs_prosud.py` (Week 0's check) instead of hand-typing its numbers into the component - ranked list of the study's 8 named points with real satellite temps, "clean separation, no overlap" badge, reusing the same verified Week 0 result rather than recomputing.
- ✅ Honesty footer: surface vs. air temperature, modelled (their one simulated day) vs. observed (satellite, real summers) - stated as a standing rule, not just in the detail cards.
- Verified live (headless-browser render against the real dev server): renders, zero console errors, matches the numbers independently confirmed earlier in this build.
- **Third review pass, 2026-11-09 — naming the study properly, plus one more real bug.** "Your 2024 study" only reads correctly for whoever commissioned it - a climate advisor, Klima-Agence, or anyone the officer forwards the page to wouldn't know what it refers to. Rewrote the panel's opening to name the study once, with who made it (PRO-SUD communes, LIST, GEO-NET), when (2024), what it covered (Esch + 10 neighbouring communes), and a direct link to the actual PDF (`minett-biosphere.com/.../Bioklima-Analyse-Region-PRO-SUD.pdf` - the same one verified back in Step 3's opening research) so anyone can check it themselves. Every later reference ("Study: hot/cool" → "Named hot/Named cool", the Kennedy line, the footer) now says "the PRO-SUD study" instead of a bare "the study" or "your study." Caught and fixed a real arithmetic bug alongside this: the "8 of 28" stat card listed 2 named sites + "+3 more" = 5, not 8 - `namedRemaining` had been subtracting from the named-only count instead of the true total (which includes unnamed facilities), so it now correctly reads "+6 more." Also checked a real lead the reviewer flagged - is Rue de Luxembourg (now the hottest non-industrial spot, 2025) close enough to the "205, rue de Luxembourg" NO2 tube (still +10% above the 2030 value) to be a second air-and-heat finding - **measured 469m apart, ruled out**: too far on what OSM itself tags as a long primary road to credibly claim as the same spot, so this stays as one coincidental shared street name, not a second claim on the page.
- **Second review pass, 2026-11-09 — content/readability, plus real bugs caught alongside the design feedback.** Fixed: "8 real summers" was `study.points.length` (8 named points) where it should've read `years.length` (4 actual summers) - a genuine code bug, not a judgment call; "Licee Guillaume Kroll" confirmed to be OSM's own typo (checked the raw tag directly - it really is missing the accent in their database), corrected via a display-name override in the pipeline (`OSM_NAME_FIXES`), not papered over in the UI; "Espace Garage Dicks" confirmed legitimate (checked its full OSM tags - operated by "Réseau Psy – Psychesch Hëllef Dobaussen," a mental-health support nonprofit, named after the building it occupies) - kept, not removed, now always shown with its kind label for context; the "4 of 4 summers" ambiguity fixed by computing real per-building year-counts (Lycée Guillaume Kroll: 3 of 4, Espace Garage Dicks: 2 of 4 - not the vague shared count from before); the Kennedy callout rewritten to drop a sentence that had literally copied the reviewer's own note verbatim ("the only claim on this page that covers both") and the "mildest of the five hotspots" line that undermined the headline's own claim. Checked whether "+16.3°C unchanged after the mask" and "Industrial land: —" (a dash) were real bugs - re-verified live and found both populated correctly; almost certainly the reviewer's browser had cached pre-fix `/data/esch-sur-alzette/*.json` responses. Added `cache: "no-store"` to every fetch in `fetchHeatMapData` regardless, since a stale-cache mismatch after a pipeline rerun is exactly the kind of thing that erodes trust in the rest of the page.
  - **Layout rebuilt per spec:** proof moved directly under the headline (was buried below 5 stat cards); stat cards cut from 5 to 2, each naming a real place and flying the map there on click (`map.flyTo`, same pattern as the NO2 tube rows) - "Hottest public/residential spot" now reverse-geocodes its cell's centroid in the pipeline (Nominatim, once per year, not live in the browser) instead of showing a bare "+13.1°C" nobody could place; the industrial "—" dash card dropped entirely, folded into a one-line footer note instead; the 2.8°C summer-swing card dropped (weather, not actionable). "vs. commune average" reworded to plain "warmer than the commune average" throughout.
  - **The 8-point list went through two rounds.** First replaced with a horizontal dot-strip (axis + colored dots + shaded gap) to make "no overlap" visible in one second instead of requiring all 8 numbers to be read - built, verified working. Then reverted on request: place names are what an officer actually recognises, which bare dots don't carry, tooltips or not. Rebuilt as `heat-hotspot-list.tsx` - a two-group list ("Study: hot" / "Study: cool"), each row with an in-row bar shaded proportional to its temperature (same "see it in one second" effect as the dot strip, inside the readable list), a labelled divider ("0.5°C gap — no overlap") standing in for the gap, click-to-fly per row, and a corrected heading ("...summers 2022–2025 (surface °C)") that incidentally fixes the "8 summers" bug by not stating a count at all. Clair-Chêne's "(approx., street not park polygon)" caveat split out of the name into its own `approximate` field, shown as a footnote asterisk - confirmed via Overpass that no OSM polygon named Clair-Chêne exists at all, so the imprecision can't actually be fixed, only labelled honestly.
- **First review pass, headline fix + industrial-land exclusion, 2026-11-08 — a reviewer caught this before it shipped.** The original headline led with "hottest patches ran 16.3°C above average," which is the ArcelorMittal Belval plant - an officer reads that as "of course the steel plant is hot" and stops reading. Checked two things before touching the wording: (1) do the hot cells sit on Metzeschmelz, the former-steelworks site being redeveloped for housing (first residents 2031) - **no**, confirmed by research: Metzeschmelz is the ex-Esch-Schifflange site (closed 2012), ~2km from Belval, which is still an actively operating ArcelorMittal plant (permits dated December 2025) - so there's no "commune is planning housing on hot land" story here, the steel plant really is just a steel plant; (2) was industrial land crowding real, actionable school hotspots out of the "hottest 10%" stat - **yes**, confirmed: with industrial cells (10.2% of the grid, via OSM `landuse=industrial`) included, only Lycée Guillaume Kroll and one social facility ever appeared in the hottest 10% across 4 years; excluding them surfaced École Jean Jaurès and École Brill too, doubling the building count from 2 of 28 to 6 of 28. Fixed by making "hottest 10%" (`build_esch_heat_grid.py`) industrial-excluded by default, with the industrial reading kept as its own separate, clearly-labeled stat ("Industrial land, {year}: +16.3°C — private land, process heat, not shown as a commune hotspot") rather than hidden. Headline swapped to the study-confirmation sentence: "Satellite data from 2022-2025 confirms the five heat hotspots your 2024 study named."

**Week 4 — ship and send:**
- Deploy, check phone load speed.
- One-page summary + email to Esch's climate pact officer and PRO-SUD. Contacts, from the press dossier: Gaëlle Tavernier at PRO-SUD (tavernier@prosud.lu, study lead) and Jürgen Junk at LIST (juergen.junk@list.lu).
- **The ask in that email:** access to their shapefile of 18,000 assessed areas. You can now say precisely why: "the public layers show the map, but not the per-area ratings" (confirmed by testing — see Data access above). Getting it unlocks the version a commune might actually pay for — click any spot, see its action priority, the matching M01–M20 measures, and how it's tracking each summer.

**Not in this step's MVP:**
- Linking cells to their measures catalogue (needs their shapefile — it's the v2 hook from the Week 4 email, not something to build blind)
- Dudelange or other communes
- Porting off Earth Engine (only matters once someone pays — see Step 2.5's equivalent GEE note)
- Population counts, future-scenario layers, automated yearly refresh

**Done when:** you can paste one URL into an email and an officer understands the point within 30 seconds, without you in the room.

### Step 4: Report download

- Generate a CSV in the browser from what is on screen: commune, station, pollutant, value, unit, timestamp, today's limit, 2030 limit, source.
- A PDF can follow if someone asks for it; a print-friendly page is the cheapest start.
- **Done when:** an officer can download a file and open it in Excel.

## Conversations, starting week 1

Start talking to people now and show each step as it becomes ready; do not wait for the finished page.

**Who to contact first**

- 2 or 3 climate advisor firms, such as Energieagence and Schroeder & Associés. One advisor serves many communes, so this is the shortest route to several of them. How many communes each one advises is unverified.
- Klima-Agence, which runs the Pacte Climat (pacteclimat@klima-agence.lu), to learn what evidence communes actually have to submit.
- Environment officers in 3 or 4 communes: Esch-sur-Alzette, Differdange, Dudelange and Kopstal.

**What to ask**

- How do you prepare air quality and adaptation evidence today, and which part takes the most time?
- What data do you wish you had and cannot get?
- Who decides whether to use a tool like this, and is there a budget for it?
- What would have to be true for you to use this page in your next audit?

**What to show**

After Step 1, the live Esch page. Present it as a draft built from public open data, not endorsed by any commune, and say plainly which parts are sample or still to come.

Once the page is live, list it as a "reuse" on data.public.lu, the national open data portal.

## Success looks like

The MVP worked if you have a real page and at least two people who say they would use it.

- The Esch page runs on real data, with no placeholders passed off as measurements.
- You have had at least 5 conversations with officers or advisors.
- At least 2 of them say something like "this would save me time" or "I would use this in our certification."
- You know whether anyone has a budget, and roughly what range.

**When to change direction:** if after about 8 conversations nobody sees a use for it, stop building and decide what to learn next: a different buyer, a different problem, or a different project. That is a useful result, not a failure.

## Not in this MVP

These wait until a commune asks for them or pays:

- A citizen app or push alerts
- Health advice such as "is it safe to jog today?"
- Forecasting and machine learning
- Any commune other than Esch-sur-Alzette
- Your own sensors
- French, German and Luxembourgish versions of the page
- Real-time alerts for commune staff

## Risks and open questions

The biggest risk is not technical: it is whether a commune will pay and whether you can reach the right person.

- **Thin history.** The trend chart starts when your collector started storing data, so it may show weeks, not years. Say so on the chart.
- **Short readings vs yearly limits.** EU limits are annual averages. A live reading cannot show compliance, so the page must never say a commune "passes" or "fails".
- **Data gaps.** Stations go quiet, as Esch Gare's NO did. The page has to handle gaps honestly.
- **Heat map limits.** Landsat gives about 100 m pixels and a morning snapshot, and clouds can leave few usable summer scenes.
- **The PRO-SUD study exists and Esch's mayor presented it.** A homemade heat map that doesn't acknowledge or build on the 2024 "Stadtklimaanalyse für die Region PRO-SUD" (GEO-NET/LIST) will get "how does this compare to ours?" as the first question. Step 3 now builds on their study instead of competing with it — see the revised Step 3.
- **The state (and now PRO-SUD) could build it.** The new air quality law gives the Administration de l'environnement duties around public information and an air quality index, and PRO-SUD already has a heat study. Position the page as commune-facing, complementary, and specifically the *living, monitored* layer on top of their one-off snapshot.
- **Being remote.** You are based in the Netherlands and communes like in-person meetings. Plan a few trips or video calls early.
- **Unknown price.** No real prices for this kind of product were found. The conversations are the first evidence.
- **Your time.** This is a side project, so keep every step small enough to finish.

## Reference: limits and data sources

The 2030 NO₂ and PM2.5 limits come from the earlier market research; the other limit values are from memory and need a check against the directive text before you show them to anyone.

| Pollutant | Annual limit today (Directive 2008/50/EC) | Annual limit from 2030 (Directive 2024/2881) | Checked? |
| --- | --- | --- | --- |
| NO₂ | 40 µg/m³ | 20 µg/m³ | Confirmed 2026-10-26 |
| PM2.5 | 25 µg/m³ | 10 µg/m³ | Confirmed 2026-10-26 |
| PM10 | 40 µg/m³ | 20 µg/m³ | Today's value confirmed 2026-10-26; 2030 value still unconfirmed — not found in this check |

**Data sources**

- [OpenAQ Explore](https://explore.openaq.org): your current feed, which carries the EEA-reported Esch/Alzette and Esch Gare stations.
- [Air Quality – Telemetric network](https://data.public.lu/en/datasets/air-quality-telemetric-network/) on data.public.lu: the official Administration de l'environnement data, published under CC0. A possible second source or cross-check for your OpenAQ feed.
- [MeteoLux API](https://data.public.lu/en/datasets/meteolux-api/) on data.public.lu: open weather data, for later wind and temperature context.
- Landsat 8/9: free thermal satellite images for the "observed since" layer (Step 3, Layer 2).
- [Stadtklimaanalyse für die Region PRO-SUD](https://gouvernement.lu/de/actualites/toutes_actualites/communiques/2024/10-octobre/22-meisch-analyse-bioclimatique.html) (government press release) and [LIST's release](https://list.lu/en/media/press/climate-change-study-on-minett-unesco-biosphere-published): the Oct 2024 bioclimatic study covering Esch and Dudelange, by GEO-NET and LIST — the base layer for Step 3. Full study PDF still needs locating/reading (not the press dossiers), per Step 3's open item.
- Geocatalogue records for the day ([9b383a69-...](https://geocatalogue.geoportail.lu/geonetwork/gr/api/records/9b383a69-4053-4d97-8b78-4a42116eeafd), WMS layer 2922) and night ([8bd389cc-...](https://geocatalogue.geoportail.lu/geonetwork/geoportail-lu/api/records/8bd389cc-1bfb-4f44-baf6-4fccdfb88a48), WMS layer 2923) PRO-SUD heat maps, served from `wms.geoportail.lu/public_map_layers/service`. Tested publicly reachable with no auth, 2026-10-27.
- [Pacte Climat NO₂ tube measurement reports](https://environnement.public.lu/content/dam/environnement/documents/publications/2025/rapport-no2-pacteclimat-2024.pdf) on data.public.lu / environnement.public.lu: annual reports 2018–2025 covering ~112 locations in 33 communes, including Esch/Alzette. Fills the gap previously marked "not available".
- [emwelt.lu](https://www.emwelt.lu) / environnement.public.lu / GEOPORTAIL: official live station data, usable as a cross-check against the OpenAQ feed.

**Esch/Alzette tube results, full history 2018–2025 (corrected annual mean, µg NO₂/m³; today's limit 40, 2030 limit 20):**

| Location | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 48/50-52, boulevard Kennedy | **52** (hotspot) | **45.7 / 45.1** (hotspot) | 36 / 37 | 35 / 35 | 36 / 36 | 30 / 30 | 27 / 27 | 27 / 27 |
| 205, rue de Luxembourg | 38 | 35.3 | 30 | 28 | 29 | 23 | 21 | 22 |
| 18, Neudorf | not measured yet | not measured yet | 32 | 31 | 31 | 26 | 24 | 23 |
| 69, rue Arthur Useldinger | 24 | 23.0 / 23.1 | 18 / 18 | 18 / 18 | 19 / 18 | 15 / 15 | 14 / 14 | 16 / 16 |

Pulled by hand from all eight PDFs (`Rapport-final-2018.pdf` through `rapport-no2-pacteclimat-2025.pdf`); no API, so this is a one-off extraction, not something Step 4 can auto-refresh each year.

**Coordinates, geocoded 2026-10-26** (via `apiv4.geoportail.lu/geocode/search`, OSM Nominatim for the one miss), ready to drop as map pins in Step 1/4:

| Location | Lat | Lon | Precision |
| --- | --- | --- | --- |
| 48, boulevard Kennedy | 49.494214 | 5.984654 | Exact (Geoportail, ratio 1.0) |
| 205, rue de Luxembourg | 49.508746 | 5.989312 | Exact (Geoportail, ratio 1.0) |
| 69, rue Arthur Useldinger | 49.505344 | 5.976617 | Exact (Geoportail, ratio 1.0) |
| 18, Neudorf (rue Neudorf) | 49.493023 | 5.992634 | Approximate — street found via OSM, no exact house-number match in either registry |

Boulevard Kennedy was a confirmed regulatory **hotspot** (>45 µg/m³, over the 40 limit) in both 2018 and 2019 — this is real, not estimated. It dropped ~31% over its first two years (52 → 36) and ~48% across the full period (52 → 27 by 2024–2025), and has stayed under the 40 limit every year since 2020. Don't attribute the drop to a specific cause (Covid, vehicle turnover) or call it "fixed" — see the framing corrections under Step 2.5. All four Esch locations comply with the 40 µg/m³ limit from 2020 onward; three of the four (Kennedy, rue de Luxembourg, Neudorf) are still above the 2030 limit of 20 as of 2025, and essentially flat rather than still falling — see the reduction-needed card in Step 2.5 for the exact framing to use. Nationally: 129 locations in 2024 (highest 32), 128 in 2025 (highest 31), no exceedances either year.

The 2025 campaign ran Jan–Dec 2025 with its final report published May 2026. Going by that lag, no 2026 report will exist until roughly mid-2027, even though a 2026 campaign is presumably running now.
