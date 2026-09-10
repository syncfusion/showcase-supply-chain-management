export interface PagedResult<T> {
  items: T[]
  count: number
  skip: number
  take: number
  aggregates?: Record<string, number>
}

export interface DashboardKpis {
  inventoryValue: number
  openPurchaseOrders: number
  supplierOtif: number
  orderFillRate: number
  inventoryTurnover: number
  ordersAtRisk: number
  changes: Record<string, number>
  trends: Record<string, number[]>
}

export interface TrendPoint {
  period: string
  inventoryValue: number
  orderDemand: number
}

export interface RiskBucket {
  risk: string
  count: number
}

export interface ExceptionItem {
  id: string
  type: string
  severity: string
  entity: string
  entityId: string
  description: string
  region: string
  warehouse: string
  detectedAt: string
  status: string
}

export interface Warehouse {
  id: string
  name: string
  code: string
  region: string
  country: string
  type: string
  latitude: number
  longitude: number
  utilization: number
  inventoryValue: number
  openOrders: number
  inboundShipments: number
  outboundShipments: number
  capacity: number
}

export interface InventoryRecord {
  id: string
  productId: string
  sku: string
  productName: string
  category: string
  warehouseId: string
  warehouseName: string
  bin: string
  quantity: number
  available: number
  reserved: number
  safetyStock: number
  reorderPoint: number
  unitCost: number
  inventoryValue: number
  status: string
  preferredSupplierId: string
  preferredSupplierName: string
  leadTimeDays: number
  lastReplenishment: string
}

export interface Supplier {
  id: string
  name: string
  region: string
  country: string
  category: string
  annualSpend: number
  leadTimeDays: number
  otif: number
  qualityScore: number
  risk: string
  openPos: number
  status: string
  latitude: number
  longitude: number
}

export interface PurchaseOrder {
  id: string
  number: string
  supplierId: string
  supplierName: string
  plant: string
  createdDate: string
  requiredDate: string
  value: number
  currency: string
  buyer: string
  items: number
  status: string
  deliveryStatus: string
  risk: string
}

export interface SalesOrder {
  id: string
  number: string
  customerId: string
  customerName: string
  region: string
  orderDate: string
  requestedDate: string
  value: number
  warehouseId: string
  warehouseName: string
  fulfillmentPct: number
  shipmentId: string
  priority: string
  status: string
  risk: string
}

export interface ProductionTask {
  id: string
  parentId: string
  name: string
  plant: string
  productionLine: string
  startDate: string
  endDate: string
  progress: number
  predecessor?: string | null
  resource: string
  isMilestone: boolean
}

export interface DockAppointment {
  id: string
  warehouseId: string
  dockId: string
  dockName: string
  subject: string
  eventType: string
  startTime: string
  endTime: string
  status: string
  location: string
  description: string
}

export interface WarehouseLocationNode {
  id: string
  parentId: string
  name: string
  level: string
  warehouseId: string
  capacity: number
  quantity: number
  utilization: number
  status: string
}

export interface PivotRow {
  year: number
  quarter: number
  month: number
  region: string
  country: string
  plant: string
  warehouse: string
  supplier: string
  product: string
  productCategory: string
  customer: string
  orderStatus: string
  revenue: number
  orderQuantity: number
  inventoryValue: number
  leadTime: number
  freightCost: number
  purchaseAmount: number
  delayDays: number
}

export interface SearchResult {
  id: string
  label: string
  subtitle: string
  type: string
  route: string
}

export interface FilterOptions {
  regions: string[]
  businessUnits: string[]
  categories: string[]
  warehouses: { id: string; name: string; region: string }[]
  riskLevels: string[]
}

export interface ListQuery {
  skip?: number
  take?: number
  startDate?: string
  endDate?: string
  search?: string
  sort?: string
  sortDirection?: string
  region?: string
  warehouse?: string
  status?: string
  risk?: string
  category?: string
  supplier?: string
  businessUnit?: string
}
