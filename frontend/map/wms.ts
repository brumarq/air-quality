/** A Mapbox raster tile URL template for one layer of a WMS 1.3.0 service in EPSG:3857. */
export function wmsTileUrl(serviceUrl: string, layer: string): string {
  const params = new URLSearchParams({
    SERVICE: "WMS",
    VERSION: "1.3.0",
    REQUEST: "GetMap",
    LAYERS: layer,
    STYLES: "",
    CRS: "EPSG:3857",
    WIDTH: "256",
    HEIGHT: "256",
    FORMAT: "image/png",
    TRANSPARENT: "true",
  })
  // Mapbox fills in {bbox-epsg-3857} per tile, so it must stay unescaped.
  return `${serviceUrl}?${params.toString()}&BBOX={bbox-epsg-3857}`
}
