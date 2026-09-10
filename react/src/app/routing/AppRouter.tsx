import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../layout/AppShell'

const DashboardPage = lazy(() => import('../../modules/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const InventoryPage = lazy(() => import('../../modules/inventory/InventoryPage').then((m) => ({ default: m.InventoryPage })))
const InventoryDetailPage = lazy(() =>
  import('../../modules/inventory/InventoryDetailPage').then((m) => ({ default: m.InventoryDetailPage })),
)
const ProcurementPage = lazy(() =>
  import('../../modules/procurement/ProcurementPage').then((m) => ({ default: m.ProcurementPage })),
)
const PurchaseOrderDetailPage = lazy(() =>
  import('../../modules/procurement/PurchaseOrderDetailPage').then((m) => ({ default: m.PurchaseOrderDetailPage })),
)
const SuppliersPage = lazy(() => import('../../modules/suppliers/SuppliersPage').then((m) => ({ default: m.SuppliersPage })))
const SupplierDetailPage = lazy(() =>
  import('../../modules/suppliers/SuppliersPage').then((m) => ({ default: m.SupplierDetailPage })),
)
const OrdersPage = lazy(() => import('../../modules/orders/OrdersPage').then((m) => ({ default: m.OrdersPage })))
const OrderDetailPage = lazy(() => import('../../modules/orders/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage })))
const WarehousesPage = lazy(() => import('../../modules/warehouses/WarehousesPage').then((m) => ({ default: m.WarehousesPage })))
const CapacityPage = lazy(() => import('../../modules/capacity/CapacityPage').then((m) => ({ default: m.CapacityPage })))
const AnalyticsPage = lazy(() => import('../../modules/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))
const PlanningWorksheetPage = lazy(() =>
  import('../../modules/analytics/PlanningWorksheetPage').then((m) => ({ default: m.PlanningWorksheetPage })),
)

const titles: Record<string, string> = {
  dashboard: 'Overview',
  inventory: 'Inventory',
  procurement: 'Procurement',
  suppliers: 'Suppliers',
  orders: 'Orders',
  warehouses: 'Warehouses',
  capacity: 'Capacity Planning',
  analytics: 'Analytics',
}

function ModuleRoute({ page, title }: { page: React.ReactNode; title: string }) {
  return (
    <AppShell title={title}>
      <Suspense fallback={<div className="agm-loading">Loading module…</div>}>{page}</Suspense>
    </AppShell>
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={<ModuleRoute title={titles.dashboard} page={<DashboardPage />} />}
      />
      <Route
        path="/inventory"
        element={<ModuleRoute title={titles.inventory} page={<InventoryPage />} />}
      />
      <Route
        path="/inventory/:inventoryId"
        element={<ModuleRoute title={titles.inventory} page={<InventoryDetailPage />} />}
      />
      <Route
        path="/procurement"
        element={<ModuleRoute title={titles.procurement} page={<ProcurementPage />} />}
      />
      <Route
        path="/procurement/:poId"
        element={<ModuleRoute title={titles.procurement} page={<PurchaseOrderDetailPage />} />}
      />
      <Route
        path="/suppliers"
        element={<ModuleRoute title={titles.suppliers} page={<SuppliersPage />} />}
      />
      <Route
        path="/suppliers/:supplierId"
        element={<ModuleRoute title={titles.suppliers} page={<SupplierDetailPage />} />}
      />
      <Route path="/orders" element={<ModuleRoute title={titles.orders} page={<OrdersPage />} />} />
      <Route
        path="/orders/:orderId"
        element={<ModuleRoute title={titles.orders} page={<OrderDetailPage />} />}
      />
      <Route
        path="/warehouses"
        element={<ModuleRoute title={titles.warehouses} page={<WarehousesPage />} />}
      />
      <Route
        path="/warehouses/:warehouseId"
        element={<ModuleRoute title={titles.warehouses} page={<WarehousesPage />} />}
      />
      <Route
        path="/capacity"
        element={<ModuleRoute title={titles.capacity} page={<CapacityPage />} />}
      />
      <Route
        path="/analytics"
        element={<ModuleRoute title={titles.analytics} page={<AnalyticsPage />} />}
      />
      <Route
        path="/analytics/planning"
        element={<ModuleRoute title="Planning Worksheet" page={<PlanningWorksheetPage />} />}
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
