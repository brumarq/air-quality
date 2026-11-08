"""
Week 0 check #2 (ESCH-HEAT-PROFILE-PLAN.md, Step 3): does Landsat's own observed
summer surface temperature agree with the PRO-SUD study's named hotspots/cool spots
for Esch? If yes, a satellite-based page is a credible "living layer" on top of their
study. If no, the whole Step 3 pitch needs rethinking before any UI gets built.

Method: Landsat 8/9 Collection 2 Level-2 ST_B10 (surface temperature), cloud-masked,
summer months (Jun-Aug) 2022-2025, median composite over a box around Esch. Anomaly =
per-point value minus the area mean, in the same spirit as the study's own anomaly/
z-score classification (not absolute degrees, which the study itself says "only hold
for that one simulated day").
"""

import ee

ee.Initialize(project="air-quality-451910")

# Named locations from the PRO-SUD study (ESCH-HEAT-PROFILE-PLAN.md Step 3, "Esch
# hotspots named in the study" / "Cool spots named"). Coordinates geocoded via
# Nominatim/OSM 2026-11-08; boulevard Kennedy reused from the already-verified
# frontend/data/no2-tubes/esch.json.
POINTS = [
    ("Rue Zénon Bernard (dense centre)", "hot", 49.4919, 5.9785),
    ("Esch-Schifflange industrial site", "hot", 49.5032, 5.9935),
    ("An der Schmelz car parks", "hot", 49.4958, 5.9670),
    ("Town hall square", "hot", 49.4959, 5.9855),
    ("Boulevard Kennedy", "hot", 49.494214, 5.984654),
    ("Parc Laval", "cool", 49.4989, 5.9781),
    ("Park Clair-Chêne (approx., street not park polygon)", "cool", 49.4987, 5.9713),
    ("Brucherbierg-Lalléngerbierg edge", "cool", 49.4950, 6.0017),
]

# Box around Esch commune, wide enough to cover all points plus margin for the
# area mean/stddev baseline.
REGION = ee.Geometry.Rectangle([5.950, 49.470, 6.020, 49.520])

CLOUD_BIT = 1 << 3
SHADOW_BIT = 1 << 4


def mask_and_scale(image):
    qa = image.select("QA_PIXEL")
    cloud_free = qa.bitwiseAnd(CLOUD_BIT).eq(0).And(qa.bitwiseAnd(SHADOW_BIT).eq(0))
    st_celsius = image.select("ST_B10").multiply(0.00341802).add(149.0).subtract(273.15)
    return st_celsius.rename("ST_C").updateMask(cloud_free)


def summer_collection(collection_id):
    return (
        ee.ImageCollection(collection_id)
        .filterBounds(REGION)
        .filterDate("2022-01-01", "2026-01-01")
        .filter(ee.Filter.calendarRange(6, 8, "month"))
        .map(mask_and_scale)
    )


l8 = summer_collection("LANDSAT/LC08/C02/T1_L2")
l9 = summer_collection("LANDSAT/LC09/C02/T1_L2")
combined = l8.merge(l9)

count = combined.size().getInfo()
print(f"Summer (Jun-Aug) 2022-2025 scenes over Esch, L8+L9, cloud-masked: {count}")

composite = combined.median().clip(REGION)

stats = composite.reduceRegion(
    reducer=ee.Reducer.mean().combine(ee.Reducer.stdDev(), sharedInputs=True),
    geometry=REGION,
    scale=100,
    bestEffort=True,
).getInfo()

area_mean = stats["ST_C_mean"]
area_sd = stats["ST_C_stdDev"]
print(f"Area mean: {area_mean:.2f}°C, stddev: {area_sd:.2f}°C (box-wide, informational only)\n")

results = []
for name, label, lat, lon in POINTS:
    pt = ee.Geometry.Point([lon, lat])
    val = composite.reduceRegion(
        reducer=ee.Reducer.first(), geometry=pt, scale=100
    ).getInfo().get("ST_C")
    if val is not None:
        results.append((name, label, val))
    else:
        print(f"{name}: no data")

# The real test isn't "is this point above/below the box-wide mean" - that box
# includes surrounding farmland, which is cooler than anywhere in town, hot spot
# or cool spot alike, so an anomaly-vs-box-mean check gives a false negative on
# every cool spot. The test that actually matters: do hot-labeled points rank
# hotter than cool-labeled points, with no overlap.
results.sort(key=lambda r: -r[2])
print(f"{'°C':>6}  {'Study says':<6}  Location")
print("-" * 70)
for name, label, val in results:
    print(f"{val:>6.2f}  {label:<6}  {name}")

hot_vals = [v for _, l, v in results if l == "hot"]
cool_vals = [v for _, l, v in results if l == "cool"]
min_hot, max_cool = min(hot_vals), max(cool_vals)
print(f"\nColdest 'hot' point: {min_hot:.2f}°C. Warmest 'cool' point: {max_cool:.2f}°C.")
if min_hot > max_cool:
    print(f"Clean separation, no overlap (gap: {min_hot - max_cool:.2f}°C) - Landsat agrees with the study's naming.")
else:
    print("Overlap found - at least one named point doesn't rank where the study says it should.")
