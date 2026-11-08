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
from shapely.geometry import box, shape, mapping, Polygon
from shapely.ops import transform as shapely_transform, unary_union

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


def reverse_geocode(lat, lon):
    """Nearest street/place name via Nominatim - used once per year to give the
    "hottest spot" stat a real location, not just a bare number."""
    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"lat": lat, "lon": lon, "format": "json", "zoom": 17},
            headers={"User-Agent": "esch-heat-profile-research/1.0 (one-off data pipeline)"},
            timeout=15,
        )
        resp.raise_for_status()
        address = resp.json().get("address", {})
        return address.get("road") or address.get("suburb") or address.get("neighbourhood")
    except requests.exceptions.RequestException:
        return None


def overpass_query(query, timeout=90, attempts=4):
    """POSTs an Overpass query with retry/backoff - the public instance returns
    transient 502/504s under load, confirmed in practice building this pipeline."""
    last_error = None
    for attempt in range(attempts):
        if attempt > 0:
            wait = attempt * 5
            print(f"  Overpass retry {attempt}/{attempts - 1} after {wait}s: {last_error}")
            time.sleep(wait)
        try:
            resp = requests.post(
                "https://overpass-api.de/api/interpreter",
                data={"data": query},
                headers={"User-Agent": "esch-heat-profile-research/1.0 (one-off data pipeline)"},
                timeout=timeout,
            )
            resp.raise_for_status()
            return resp.json()["elements"]
        except requests.exceptions.RequestException as e:
            last_error = e
    raise RuntimeError(f"Overpass failed after {attempts} attempts: {last_error}")


def fetch_industrial_landuse(boundary_4326):
    """Industrial land (landuse=industrial) within Esch, as one merged polygon - used to
    exclude cells like the active ArcelorMittal Belval plant from the "hottest 10%"
    headline figure. That land reads extremely hot (process heat, bare ground - see
    ESCH-HEAT-PROFILE-PLAN.md), but it's private industrial land a commune officer has
    no lever over, and a reviewer caught 2026-11-xx that it was crowding real,
    actionable school hotspots out of the hottest-10% set entirely. Confirmed by
    checking: with industrial cells included, only Lycée Guillaume Kroll and one
    unnamed facility ever appeared in the hottest 10%; excluding them surfaced École
    Jean Jaurès and École Brill too, in the years industrial cells had been dominating."""
    minx, miny, maxx, maxy = boundary_4326.bounds
    bbox = f"{miny},{minx},{maxy},{maxx}"
    query = f"""
    [out:json][timeout:50];
    (
      way["landuse"="industrial"]({bbox});
      relation["landuse"="industrial"]({bbox});
    );
    out geom;
    """
    elements = overpass_query(query, timeout=60)

    polys = []
    for el in elements:
        if el["type"] == "way" and "geometry" in el:
            coords = [(pt["lon"], pt["lat"]) for pt in el["geometry"]]
            if len(coords) >= 3:
                try:
                    polys.append(Polygon(coords))
                except Exception:
                    continue
    return unary_union(polys) if polys else None


# Display-name corrections for confirmed OSM typos - checked against OSM's own raw
# tag (not a guess): way/148555060's name tag is literally "Licee Guillaume Kroll",
# missing the accent and misspelled, confirmed 2026-11-09 via a direct Overpass lookup.
OSM_NAME_FIXES = {
    "Licee Guillaume Kroll": "Lycée Guillaume Kroll",
}


def fetch_sensitive_buildings(boundary_4326):
    """Schools, kindergartens, and care facilities from OSM via Overpass - point
    locations, not building footprints (see the resolution conversation this script
    came from). Care facilities use several different tag combinations in practice -
    narrowing to just social_facility=nursing_home found zero in Esch despite it having
    real ones (Résidence Op der Léier, an assisted-living home, tags as
    social_facility=assisted_living, not nursing_home) - a tagging-convention gap in
    OSM, not an absence of care facilities, confirmed 2026-11-08 by widening the query."""
    minx, miny, maxx, maxy = boundary_4326.bounds
    bbox = f"{miny},{minx},{maxy},{maxx}"
    # social_facility's care-related subtypes combined into one regex clause rather than
    # one per subtype - cuts the query from 14 clauses to 6, since the unnarrowed version
    # was timing out against the public Overpass instance.
    query = f"""
    [out:json][timeout:50];
    (
      node["amenity"="school"]({bbox});
      way["amenity"="school"]({bbox});
      node["amenity"="kindergarten"]({bbox});
      way["amenity"="kindergarten"]({bbox});
      node["social_facility"~"nursing_home|assisted_living|group_home"]({bbox});
      way["social_facility"~"nursing_home|assisted_living|group_home"]({bbox});
      node["amenity"="nursing_home"]({bbox});
      way["amenity"="nursing_home"]({bbox});
      node["amenity"="social_facility"]({bbox});
      way["amenity"="social_facility"]({bbox});
      node["healthcare"="nursing_home"]({bbox});
      way["healthcare"="nursing_home"]({bbox});
    );
    out center;
    """
    elements = overpass_query(query)

    buildings = []
    for el in elements:
        lon, lat = (el["lon"], el["lat"]) if el["type"] == "node" else (el["center"]["lon"], el["center"]["lat"])
        pt = shape({"type": "Point", "coordinates": [lon, lat]})
        if not boundary_4326.contains(pt):
            continue
        tags = el.get("tags", {})
        if tags.get("amenity") == "school":
            kind = "school"
        elif tags.get("amenity") == "kindergarten":
            kind = "kindergarten"
        else:
            # Any care-facility match above, regardless of exact tag combination -
            # the page cares about "vulnerable people living here," not OSM's internal
            # distinction between nursing/assisted-living/group-home subtypes.
            kind = "care_facility"
        name = tags.get("name", "(unnamed)")
        buildings.append({
            "osm_id": f"{el['type']}/{el['id']}",
            "name": OSM_NAME_FIXES.get(name, name),
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

    print("Fetching industrial landuse from OSM (to exclude private industrial land from the 'hottest 10%' headline figure)...")
    industrial_union = fetch_industrial_landuse(boundary_4326)
    for c in cells:
        c["is_industrial"] = bool(industrial_union and industrial_union.contains(c["centroid_4326"]))
    n_industrial = sum(c["is_industrial"] for c in cells)
    print(f"  {n_industrial} of {len(cells)} cells are on industrial land ({100 * n_industrial / len(cells):.1f}%)")

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

        # "Hottest 10%" is computed over non-industrial cells only - a reviewer caught
        # that including private industrial land (the active ArcelorMittal Belval plant
        # reads ~16C above the commune mean, dominated by process heat and bare ground,
        # not urban form a commune can act on) was crowding real school hotspots out of
        # this set entirely. See fetch_industrial_landuse's docstring for the before/after.
        non_industrial_by_id = {c["id"]: c["is_industrial"] for c in cells}
        valid_anomalies = [
            (cid, v[year]["anomaly_c"]) for cid, v in per_cell_year_data.items()
            if v.get(year) and v[year]["anomaly_c"] is not None and not non_industrial_by_id[cid]
        ]
        valid_anomalies.sort(key=lambda x: x[1])
        p90_index = int(len(valid_anomalies) * 0.9)
        hottest_threshold = valid_anomalies[p90_index][1] if valid_anomalies else None

        hottest_cell_ids = {
            cid for cid, v in per_cell_year_data.items()
            if v.get(year) and v[year]["anomaly_c"] is not None
            and not non_industrial_by_id[cid] and v[year]["anomaly_c"] >= hottest_threshold
        }

        industrial_anomalies = [
            v[year]["anomaly_c"] for cid, v in per_cell_year_data.items()
            if v.get(year) and v[year]["anomaly_c"] is not None and non_industrial_by_id[cid]
        ]

        # The single hottest non-industrial cell's place name, reverse-geocoded once here
        # rather than live in the browser - a reviewer wanted "+X C" paired with a real
        # "where", not a bare number nobody can place.
        hottest_place = None
        hottest_lat = hottest_lon = None
        if valid_anomalies:
            hottest_cell_id = valid_anomalies[-1][0]
            hottest_cell = next(c for c in cells if c["id"] == hottest_cell_id)
            centroid = hottest_cell["centroid_4326"]
            hottest_lat, hottest_lon = centroid.y, centroid.x
            hottest_place = reverse_geocode(hottest_lat, hottest_lon)

        yearly_stats[year] = {
            "commune_mean_c": round(commune_mean, 2),
            "hottest_10pct_threshold_anomaly_c": round(hottest_threshold, 2) if hottest_threshold else None,
            "hottest_10pct_cell_count": len(hottest_cell_ids),
            "hottest_cell_ids": sorted(hottest_cell_ids),
            "hottest_non_industrial_anomaly_c": round(valid_anomalies[-1][1], 2) if valid_anomalies else None,
            "hottest_non_industrial_place": hottest_place,
            "hottest_non_industrial_lat": hottest_lat,
            "hottest_non_industrial_lon": hottest_lon,
            "industrial_max_anomaly_c": round(max(industrial_anomalies), 2) if industrial_anomalies else None,
            "industrial_cell_count": n_industrial,
        }
        print(f"  done. hottest-10% threshold (non-industrial): anomaly >= {hottest_threshold:+.2f}°C over {len(hottest_cell_ids)} cells")
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
                "properties": {"id": c["id"], "is_industrial": c["is_industrial"], **{
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
