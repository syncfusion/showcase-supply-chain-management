import { DataManager, UrlAdaptor, Query } from '@syncfusion/ej2-data'
import { getNetworkSimulation } from './http'

/** Syncfusion UrlAdaptor that injects network-simulation header when XHR is used. */
export class AgmUrlAdaptor extends UrlAdaptor {
  processQuery(dm: DataManager, query: Query, hierarchyFilters?: object[]): object {
    const request = super.processQuery(dm, query, hierarchyFilters) as Record<string, unknown>
    const ds = dm.dataSource as { beforeSend?: (dm: DataManager, request: XMLHttpRequest) => void }
    const previous = ds.beforeSend
    ds.beforeSend = (dataManager, xhr) => {
      try {
        xhr.setRequestHeader('X-Network-Simulation', getNetworkSimulation())
      } catch {
        // Fetch-based requests may not expose setRequestHeader the same way
      }
      previous?.(dataManager, xhr)
    }
    return request
  }
}

export function createRemoteDataManager(url: string) {
  const manager = new DataManager({
    url,
    adaptor: new AgmUrlAdaptor(),
  })
  return { manager, query: new Query() }
}

export { DataManager, Query, UrlAdaptor }
