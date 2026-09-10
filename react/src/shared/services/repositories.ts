import { apiGet, apiPost } from './http'
import type {
  DashboardKpis,
  DockAppointment,
  ExceptionItem,
  FilterOptions,
  InventoryRecord,
  ListQuery,
  PagedResult,
  PivotRow,
  ProductionTask,
  PurchaseOrder,
  RiskBucket,
  SalesOrder,
  SearchResult,
  Supplier,
  TrendPoint,
  Warehouse,
  WarehouseLocationNode,
} from '../models/types'

export const dashboardRepository = {
  getKpis: (query?: ListQuery) => apiGet<DashboardKpis>('/dashboard/kpis', query),
  getTrend: (query?: ListQuery) => apiGet<TrendPoint[]>('/dashboard/inventory-trend', query),
  getSupplierRisk: (query?: ListQuery) => apiGet<RiskBucket[]>('/dashboard/supplier-risk', query),
  getExceptions: (query?: ListQuery) => apiGet<PagedResult<ExceptionItem>>('/dashboard/exceptions', query),
  getNetwork: () =>
    apiGet<{
      warehouses: Warehouse[]
      suppliers: Supplier[]
      routes: {
        id: string
        originLat: number
        originLng: number
        destLat: number
        destLng: number
        mode: string
        status: string
      }[]
    }>('/dashboard/network'),
}

export const inventoryRepository = {
  list: (query?: ListQuery) => apiGet<PagedResult<InventoryRecord>>('/inventory', query),
  getById: (id: string) => apiGet<{ item: InventoryRecord; locations: InventoryRecord[]; transactions: unknown[] }>(`/inventory/${id}`),
  getAdjustments: () => apiGet<PagedResult<InventoryRecord>>('/inventory/adjustments'),
  saveAdjustments: (rows: unknown[]) => apiPost<{ saved: number; message: string }>('/inventory/adjustments', rows),
  getCharts: () =>
    apiGet<{
      byWarehouse: { warehouse: string; value: number }[]
      byCategory: { category: string; value: number }[]
      byStatus: { status: string; count: number }[]
    }>('/inventory/charts'),
  getAggregates: (query?: ListQuery) =>
    apiGet<{ aggregates: Record<string, number> }>('/inventory/aggregates', query),
}

export const supplierRepository = {
  list: (query?: ListQuery) => apiGet<PagedResult<Supplier>>('/suppliers', query),
  getById: (id: string) => apiGet<Record<string, unknown>>(`/suppliers/${id}`),
}

export const procurementRepository = {
  list: (query?: ListQuery) => apiGet<PagedResult<PurchaseOrder>>('/purchase-orders', query),
  getById: (id: string) => apiGet<Record<string, unknown>>(`/purchase-orders/${id}`),
  approve: (id: string, comment?: string) => apiPost(`/purchase-orders/${id}/approve`, { comment }),
  reject: (id: string, comment?: string) => apiPost(`/purchase-orders/${id}/reject`, { comment }),
}

export const orderRepository = {
  list: (query?: ListQuery) => apiGet<PagedResult<SalesOrder>>('/orders', query),
  getById: (id: string) => apiGet<Record<string, unknown>>(`/orders/${id}`),
}

export const warehouseRepository = {
  list: (query?: ListQuery) => apiGet<PagedResult<Warehouse>>('/warehouses', query),
  getById: (id: string) =>
    apiGet<{
      warehouse: Warehouse
      dockAppointments: DockAppointment[]
      locations: WarehouseLocationNode[]
      inventoryByCategory: { category: string; value: number }[]
    }>(`/warehouses/${id}`),
}

export const capacityRepository = {
  list: () => apiGet<ProductionTask[]>('/production-orders'),
}

export const analyticsRepository = {
  pivot: () => apiGet<PivotRow[]>('/analytics/pivot'),
  spendBySupplier: () => apiGet<{ name: string; annualSpend: number; region: string }[]>('/analytics/spend-by-supplier'),
  inventoryByRegion: () => apiGet<{ region: string; value: number }[]>('/analytics/inventory-by-region'),
}

export const metaRepository = {
  filters: () => apiGet<FilterOptions>('/meta/filters'),
  search: async (q: string) => {
    const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) throw new Error('Search failed')
    return response.json() as Promise<SearchResult[]>
  },
}
