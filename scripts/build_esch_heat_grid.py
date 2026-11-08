"""
Step 3, Week 1 (ESCH-HEAT-PROFILE-PLAN.md): the heat-map data pipeline.

Builds a 100m grid over Esch-sur-Alzette's real commune boundary, computes per-year
(2022-2025) summer Landsat surface-temperature anomaly + absolute °C, and Sentinel-2
NDVI, all at the grid's native 100m - no finer, since that's the thermal sensor's
actual resolution and finer would be false precision (see the conversation this script
came out of). Also pulls sensitive buildings (schools, crèches, care homes) from OSM.
Outputs static GeoJSON/JSON under frontend/public/data/esch/ - no backend, no Kafka,
this data changes once a year at most.
"""

import json
import time
from pathlib import Path

import ee
import requests
from pyproj import Transformer
from shapely.geometry import box, shape, mapping
from shapely.ops import transform as shapely_transform

ee.Initialize(project="air-quality-451910")

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "frontend" / "public" / "data" / "esch-sur-alzette"
OUT_DIR.mkdir(parents=True, exist_ok=True)

CELL_SIZE_M = 100
MIN_OVERLAP_FRACTION = 0.3  # drop sliver cells at the boundary edge
YEARS = [2022, 2023, 2024, 2025]

# EPSG:2169 (Luxembourg TM) rather than EPSG:3857 (Web Mercator): Mercator inflates
# distances by 1/cos(latitude) ~= 1.54x at Luxembourg's ~49.5N, so a "100-unit" step
# there is only ~65m on the ground - confirmed by a first run that produced 3487 cells
# instead of the expected ~1435. EPSG:2169 is Luxembourg's own real-meter projection
# (also already confirmed as a supported CRS on the PRO-SUD WMS endpoint).
to_local = Transformer.from_crs("EPSG:4326", "EPSG:2169", always_xy=True).transform
to_4326 = Transformer.from_crs("EPSG:2169", "EPSG:4326", always_xy=True).transform


def fetch_esch_boundary():
    """Esch-sur-Alzette's real administrative boundary (LAU2 0204), from the
    Administration du Cadastre et de la Topographie's own dataset on data.public.lu -
    not a bounding box, the actual commune polygon."""
    url = "https://download.data.public.lu/resources/limites-administratives-du-grand-duche-de-luxembourg/20231123-101528/communes4326.geojson"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    esch = next(f for f in data["features"] if f["properties"]["LAU2"] == "0204")
    return shape(esch["geometry"])  # EPSG:4326


def build_grid(boundary_4326):
    boundary_local = shapely_transform(to_local, boundary_4326)
    minx, miny, maxx, maxy = boundary_local.bounds

    cells = []
    y = miny
    row = 0
    while y < maxy:
        x = minx
        col = 0
        while x < maxx:
            cell = box(x, y, x + CELL_SIZE_M, y + CELL_SIZE_M)
            overlap = cell.intersection(boundary_local)
            if overlap.area / cell.area >= MIN_OVERLAP_FRACTION:
                cell_4326 = shapely_transform(to_4326, cell)
                centroid_4326 = shapely_transform(to_4326, cell.centroid)
                cells.append({
                    "id": f"r{row}c{col}",
                    "geometry_4326": cell_4326,
                    "centroid_4326": centroid_4326,
                })
            x += CELL_SIZE_M
            col += 1
        y += CELL_SIZE_M
        row += 1
    return cells


def fetch_sensitive_buildings(boundary_4326):
    """Schools, kindergartens, and care homes from OSM via Overpass - point locations,
    not building footprints (see the resolution conversation this script came from)."""
    minx, miny, maxx, maxy = boundary_4326.bounds
    query = f"""
    [out:json][timeout:30];
    (
      node["amenity"="school"]({miny},{minx},{maxy},{maxx});
      way["amenity"="school"]({miny},{minx},{maxy},{maxx});
      node["amenity"="kindergarten"]({miny},{minx},{maxy},{maxx});
      way["amenity"="kindergarten"]({miny},{minx},{maxy},{maxx});
      node["social_facility"="nursing_home"]({miny},{minx},{maxy},{maxx});
      way["social_facility"="nursing_home"]({miny},{minx},{maxy},{maxx});
    );
    out center;
    """
    resp = requests.post(
        "https://overpass-api.de/api/interpreter",
        data={"data": query},
        headers={"User-Agent": "esch-heat-profile-research/1.0 (one-off data pipeline)"},
        timeout=60,
    )
    resp.raise_for_status()
    elements = resp.json()["elements"]

    buildings = []
    for el in elements:
        lon, lat = (el["lon"], el["lat"]) if el["type"] == "node" else (el["center"]["lon"], el["center"]["lat"])
        pt = shape({"type": "Point", "coordinates": [lon, lat]})
        if not boundary_4326.contains(pt):
            continue
        tags = el.get("tags", {})
        kind = (
            "school" if tags.get("amenity") == "school"
            else "kindergarten" if tags.get("amenity") == "kindergarten"
            else "nursing_home"
        )
        buildings.append({
            "osm_id": f"{el['type']}/{el['id']}",
            "name": tags.get("name", "(unnamed)"),
            "kind": kind,
            "lat": lat,
            "lon": lon,
        })
    return buildings


CLOUD_BIT = 1 << 3
SHADOW_BIT = 1 << 4


def mask_and_scale_st(image):
    qa = image.select("QA_PIXEL")
    cloud_free = qa.bitwiseAnd(CLOUD_BIT).eq(0).And(qa.bitwiseAnd(SHADOW_BIT).eq(0))
    st_celsius = image.select("ST_B10").multiply(0.00341802).add(149.0).subtract(273.15)
    return st_celsius.rename("ST_C").updateMask(cloud_free)


def summer_landsat(region, year):
    start, end = f"{year}-01-01", f"{year + 1}-01-01"
    l8 = (
        ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
        .filterBounds(region).filterDate(start, end)
        .filter(ee.Filter.calendarRange(6, 8, "month")).map(mask_and_scale_st)
    )
    l9 = (
        ee.ImageCollection("LANDSAT/LC09/C02/T1_L2")
        .filterBounds(region).filterDate(start, end)
        .filter(ee.Filter.calendarRange(6, 8, "month")).map(mask_and_scale_st)
    )
    return l8.merge(l9).median()


def summer_ndvi(region, year):
    start, end = f"{year}-01-01", f"{year + 1}-01-01"
    s2 = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(region).filterDate(start, end)
        .filter(ee.Filter.calendarRange(6, 8, "month"))
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 40))
    )

    def add_ndvi(img):
        return img.normalizedDifference(["B8", "B4"]).rename("NDVI")

    return s2.map(add_ndvi).median()


def main():
    print("Fetching Esch commune boundary (ACT, LAU2 0204)...")
    boundary_4326 = fetch_esch_boundary()
    region = ee.Geometry(mapping(boundary_4326))

    print("Building 100m grid over the boundary...")
    cells = build_grid(boundary_4326)
    print(f"  {len(cells)} cells (expected ~1435 for Esch's 14.35 km^2)")

    print("Fetching sensitive buildings from OSM (schools, kindergartens, care homes)...")
    buildings = fetch_sensitive_buildings(boundary_4326)
    print(f"  {len(buildings)} buildings")

    # One ee.FeatureCollection of cell centroids, reused for every year's reduceRegions
    # call - sampling at the centroid rather than averaging over the cell polygon, since
    # at 100m-cell-vs-100m-pixel scale the two are nearly identical and centroid sampling
    # is far cheaper server-side.
    cell_features = [
        ee.Feature(ee.Geometry.Point([c["centroid_4326"].x, c["centroid_4326"].y]), {"id": c["id"]})
        for c in cells
    ]
    cell_fc = ee.FeatureCollection(cell_features)

    per_cell_year_data = {c["id"]: {} for c in cells}
    yearly_stats = {}

    for year in YEARS:
        print(f"Year {year}: computing summer composite + commune mean...")
        st_image = summer_landsat(region, year)
        ndvi_image = summer_ndvi(region, year)
        combined = st_image.addBands(ndvi_image)

        commune_mean = combined.select("ST_C").reduceRegion(
            reducer=ee.Reducer.mean(), geometry=region, scale=100, bestEffort=True
        ).getInfo().get("ST_C")

        print(f"  commune mean: {commune_mean:.2f}°C, sampling {len(cells)} cells...")
        sampled = combined.reduceRegions(
            collection=cell_fc, reducer=ee.Reducer.first(), scale=100
        ).getInfo()

        for feat in sampled["features"]:
            props = feat["properties"]
            cell_id = props["id"]
            st_c = props.get("ST_C")
            ndvi = props.get("NDVI")
            per_cell_year_data[cell_id][year] = {
                "temp_c": round(st_c, 2) if st_c is not None else None,
                "anomaly_c": round(st_c - commune_mean, 2) if st_c is not None else None,
                "ndvi": round(ndvi, 3) if ndvi is not None else None,
            }

        valid_anomalies = [
            v[year]["anomaly_c"] for v in per_cell_year_data.values()
            if v.get(year) and v[year]["anomaly_c"] is not None
        ]
        valid_anomalies.sort()
        p90_index = int(len(valid_anomalies) * 0.9)
        hottest_threshold = valid_anomalies[p90_index] if valid_anomalies else None

        hottest_cell_ids = {
            cid for cid, v in per_cell_year_data.items()
            if v.get(year) and v[year]["anomaly_c"] is not None and v[year]["anomaly_c"] >= hottest_threshold
        }

        yearly_stats[year] = {
            "commune_mean_c": round(commune_mean, 2),
            "hottest_10pct_threshold_anomaly_c": round(hottest_threshold, 2) if hottest_threshold else None,
            "hottest_10pct_cell_count": len(hottest_cell_ids),
            "hottest_cell_ids": sorted(hottest_cell_ids),
        }
        print(f"  done. hottest-10% threshold: anomaly >= {hottest_threshold:+.2f}°C over {len(hottest_cell_ids)} cells")
        time.sleep(1)  # be polite to the EE backend between years

    # Which sensitive buildings fall in a hottest-10% cell, per year - nearest cell by
    # simple distance, since buildings are points and cells are ~100m squares.
    print("Matching sensitive buildings to grid cells...")
    cell_lookup = [(c["id"], c["centroid_4326"]) for c in cells]
    for b in buildings:
        pt = shape({"type": "Point", "coordinates": [b["lon"], b["lat"]]})
        nearest_id = min(cell_lookup, key=lambda c: c[1].distance(pt))[0]
        b["nearest_cell_id"] = nearest_id

    for year in YEARS:
        hottest_ids = set(yearly_stats[year]["hottest_cell_ids"])
        yearly_stats[year]["sensitive_buildings_in_hottest_10pct"] = [
            {"name": b["name"], "kind": b["kind"], "osm_id": b["osm_id"]}
            for b in buildings if b["nearest_cell_id"] in hottest_ids
        ]

    print("Writing output files...")

    grid_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"id": c["id"], **{
                    f"{key}_{year}": per_cell_year_data[c["id"]].get(year, {}).get(key)
                    for year in YEARS for key in ("temp_c", "anomaly_c", "ndvi")
                }},
                "geometry": mapping(c["geometry_4326"]),
            }
            for c in cells
        ],
    }
    (OUT_DIR / "heat-grid.geojson").write_text(json.dumps(grid_geojson))

    buildings_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {k: v for k, v in b.items() if k not in ("lat", "lon")},
                "geometry": {"type": "Point", "coordinates": [b["lon"], b["lat"]]},
            }
            for b in buildings
        ],
    }
    (OUT_DIR / "sensitive-buildings.geojson").write_text(json.dumps(buildings_geojson))

    boundary_geojson = {"type": "Feature", "properties": {"name": "Esch-sur-Alzette", "lau2": "0204"}, "geometry": mapping(boundary_4326)}
    (OUT_DIR / "boundary.geojson").write_text(json.dumps(boundary_geojson))

    (OUT_DIR / "stats.json").write_text(json.dumps({
        "generatedAt": time.strftime("%Y-%m-%d"),
        "gridCellSizeMeters": CELL_SIZE_M,
        "gridCellCount": len(cells),
        "years": yearly_stats,
    }, indent=2))

    print(f"Done. Wrote {len(cells)} cells, {len(buildings)} buildings to {OUT_DIR}")


if __name__ == "__main__":
    main()
