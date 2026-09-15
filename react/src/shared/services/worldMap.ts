/** Shared world-map GeoJSON — fetched once, reused across Dashboard / Warehouses / Suppliers / Orders. */
let worldMapPromise: Promise<object> | null = null

export function loadWorldMap(): Promise<object> {
  if (!worldMapPromise) {
    worldMapPromise = fetch('https://cdn.syncfusion.com/maps/map-data/world-map.json')
      .then((r) => {
        if (!r.ok) throw new Error(`World map HTTP ${r.status}`)
        return r.json() as Promise<object>
      })
      .catch((err) => {
        worldMapPromise = null
        throw err
      })
  }
  return worldMapPromise
}
