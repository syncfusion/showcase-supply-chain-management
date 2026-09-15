import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ButtonComponent } from '@syncfusion/ej2-react-buttons'
import { TabComponent, TabItemDirective, TabItemsDirective } from '@syncfusion/ej2-react-navigations'
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Page,
  Sort,
} from '@syncfusion/ej2-react-grids'
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject as ChartInject,
  ColumnSeries,
  Category,
  Tooltip,
} from '@syncfusion/ej2-react-charts'
import { ToastComponent } from '@syncfusion/ej2-react-notifications'
import { DetailBreadcrumb } from '../../shared/components/DetailBreadcrumb'
import { inventoryRepository } from '../../shared/services/repositories'
import { ApiError } from '../../shared/services/http'
import type { InventoryRecord } from '../../shared/models/types'
import { formatCurrency, formatNumber } from '../../shared/utils/format'
import { usePageShowcase } from '../../shared/showcase/usePageShowcase'
import { useSettings } from '../../app/providers/SettingsProvider'

const showcase = [
  { name: 'Tabs', features: ['Overview / Locations / Transactions / Demand'] },
  { name: 'Data Grid', features: ['Stock by location', 'Transaction history'] },
  { name: 'Charts', features: ['Demand visualization'] },
]

function locationStatusClass(status: string) {
  const normalized = status.toLowerCase()
  if (normalized.includes('healthy') || normalized.includes('in stock')) return 'healthy'
  if (normalized.includes('out')) return 'critical'
  if (normalized.includes('low') || normalized.includes('critical')) return 'critical'
  return 'warning'
}

interface ToastMessage {
  title: string
  content: string
  cssClass: string
}

export function InventoryDetailPage() {
  const { syncfusionTheme } = useSettings()
  usePageShowcase(showcase)
  const { inventoryId } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<InventoryRecord | null>(null)
  const [locations, setLocations] = useState<InventoryRecord[]>([])
  const [transactions, setTransactions] = useState<{ id: string; date: string; type: string; quantity: number; warehouse: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null)
  const toastRef = useRef<ToastComponent>(null)

  useEffect(() => {
    if (!inventoryId) {
      setLoading(false)
      setLoadError('No inventory identifier was provided in the route.')
      setToastMessage({
        title: 'Missing inventory id',
        content: 'No inventory identifier was provided in the route.',
        cssClass: 'e-toast-danger',
      })
      return
    }
    setLoading(true)
    setLoadError(null)
    setToastMessage(null)
    inventoryRepository
      .getById(inventoryId)
      .then((res) => {
        if (!res || !res.item) {
          const message = `Inventory record "${inventoryId}" was not found.`
          setLoadError(message)
          setToastMessage({
            title: 'Inventory not found',
            content: message,
            cssClass: 'e-toast-warning',
          })
          return
        }
        setItem(res.item)
        setLocations(res.locations ?? [])
        setTransactions((res.transactions as typeof transactions) ?? [])
      })
      .catch((err: unknown) => {
        const isNotFound = err instanceof ApiError && err.status === 404
        const message = isNotFound
          ? `Inventory record "${inventoryId}" was not found.`
          : err instanceof Error
            ? err.message
            : 'Unable to load inventory detail.'
        setLoadError(message)
        setToastMessage({
          title: isNotFound ? 'Inventory not found' : 'Failed to load inventory',
          content: message,
          cssClass: isNotFound ? 'e-toast-warning' : 'e-toast-danger',
        })
      })
      .finally(() => setLoading(false))
  }, [inventoryId])

  // Once the ToastComponent has been mounted (or re-mounted via the empty-state branch)
  // and we have a message queued, surface it. This avoids the race where the API call
  // resolves before the ToastComponent's ref is attached.
  useEffect(() => {
    if (!toastMessage) return
    const instance = toastRef.current
    if (!instance) return
    instance.show(toastMessage)
  }, [toastMessage, item])

  if (loading && !item) return <div className="agm-loading">Loading inventory detail…</div>

  if (!item) {
    return (
      <div>
        <div className="agm-detail-header">
          <DetailBreadcrumb
            items={[
              { text: 'Inventory', url: '/inventory' },
              { text: inventoryId ?? 'Not found' },
            ]}
          />
          <h1 style={{ margin: 0, fontFamily: 'var(--agm-display)', fontSize: '1.5rem' }}>
            Inventory detail unavailable
          </h1>
          <p className="agm-muted" style={{ margin: 0 }}>
            {loadError ?? 'We could not find the requested inventory record.'}
          </p>
        </div>
        <div className="agm-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}>
          <p style={{ margin: 0 }}>
            The inventory id <code>{inventoryId}</code> does not match an existing SKU, product id, or inventory id.
            This can happen when a saved view, link, or search result is stale.
          </p>
          <ButtonComponent
            cssClass="e-primary"
            onClick={() => navigate('/inventory')}
          >
            Back to inventory list
          </ButtonComponent>
        </div>
        <ToastComponent ref={toastRef} position={{ X: 'Right', Y: 'Bottom' }} />
      </div>
    )
  }

  const demand = Array.from({ length: 8 }, (_, i) => ({
    week: `W${i + 1}`,
    demand: 40 + ((item.quantity + i * 17) % 120),
  }))

  return (
    <div>
      <div className="agm-detail-header">
        <DetailBreadcrumb
          items={[
            { text: 'Inventory', url: '/inventory' },
            { text: item.sku },
          ]}
        />
        <h1 style={{ margin: 0, fontFamily: 'var(--agm-display)', fontSize: '1.5rem' }}>
          {item.sku} · {item.productName}
        </h1>
        <p className="agm-muted" style={{ margin: 0 }}>
          {item.category} · {item.warehouseName} ·{' '}
          <span className={`agm-status ${item.status === 'Healthy' ? 'healthy' : item.status === 'Out of Stock' ? 'critical' : 'warning'}`}>
            {item.status}
          </span>
        </p>
      </div>

      <div className="agm-kpi-grid" style={{ gridTemplateColumns: 'repeat(6, minmax(0,1fr))' }}>
        {[
          ['On hand', formatNumber(item.quantity)],
          ['Available', formatNumber(item.available)],
          ['Reserved', formatNumber(item.reserved)],
          ['Safety', formatNumber(item.safetyStock)],
          ['Reorder', formatNumber(item.reorderPoint)],
          ['Value', formatCurrency(item.inventoryValue)],
        ].map(([label, value]) => (
          <div className="agm-kpi" key={label}>
            <div className="agm-kpi__label">{label}</div>
            <div className="agm-kpi__value" style={{ fontSize: '1.15rem' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="agm-panel">
        <TabComponent heightAdjustMode="Content">
          <TabItemsDirective>
            <TabItemDirective
              header={{ text: 'Overview' }}
              content={() => (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '0.75rem', padding: '0.5rem 0' }}>
                  {[
                    ['SKU', item.sku],
                    ['Product', item.productName],
                    ['Category', item.category],
                    ['Supplier', item.preferredSupplierName],
                    ['Bin', item.bin],
                    ['Unit cost', formatCurrency(item.unitCost)],
                    ['Lead time', `${item.leadTimeDays} days`],
                    ['Last replenishment', item.lastReplenishment],
                    ['Warehouse', item.warehouseName],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="agm-kpi__label">{k}</div>
                      <div>{v}</div>
                    </div>
                  ))}
                </div>
              )}
            />
            <TabItemDirective
              header={{ text: 'Stock by Location' }}
              content={() => (
                <GridComponent
                  dataSource={locations}
                  allowPaging
                  allowSorting
                  height={280}
                  pageSettings={{ pageSize: 8 }}
                  queryCellInfo={(args) => {
                    if (args.column?.field === 'status' && args.cell && args.data) {
                      const status = String((args.data as { status?: string }).status ?? '')
                      args.cell.innerHTML = `<span class="agm-status ${locationStatusClass(status)}">${status}</span>`
                    }
                  }}
                >
                  <Inject services={[Page, Sort]} />
                  <ColumnsDirective>
                    <ColumnDirective field="warehouseName" headerText="Warehouse" width={200} />
                    <ColumnDirective field="bin" headerText="Bin" width={110} />
                    <ColumnDirective field="quantity" headerText="Qty" width={90} type="number" format="N0" textAlign="Right" />
                    <ColumnDirective field="available" headerText="Available" width={100} type="number" format="N0" textAlign="Right" />
                    <ColumnDirective field="reserved" headerText="Reserved" width={100} type="number" format="N0" textAlign="Right" />
                    <ColumnDirective field="status" headerText="Status" width={120} />
                    <ColumnDirective field="inventoryValue" headerText="Value" width={130} type="number" format="C0" textAlign="Right" />
                  </ColumnsDirective>
                </GridComponent>
              )}
            />
            <TabItemDirective
              header={{ text: 'Transactions' }}
              content={() => (
                <GridComponent dataSource={transactions} allowPaging height={280} pageSettings={{ pageSize: 8 }}>
                  <Inject services={[Page]} />
                  <ColumnsDirective>
                    <ColumnDirective field="date" headerText="Date" width={120} type="date" format="MM/dd/yyyy" />
                    <ColumnDirective field="type" headerText="Type" width={110} />
                    <ColumnDirective field="quantity" headerText="Qty" width={90} type="number" format="N0" textAlign="Right" />
                    <ColumnDirective field="warehouse" headerText="Warehouse" width={200} />
                  </ColumnsDirective>
                </GridComponent>
              )}
            />
            <TabItemDirective
              header={{ text: 'Demand' }}
              content={() => (
                <ChartComponent
                  height="280px"
                  primaryXAxis={{ valueType: 'Category' }}
                  primaryYAxis={{ labelFormat: 'N0' }}
                  tooltip={{ enable: true, format: '${point.x}: ${point.y}' }}
                  theme={syncfusionTheme}
                >
                  <ChartInject services={[ColumnSeries, Category, Tooltip]} />
                  <SeriesCollectionDirective>
                    <SeriesDirective dataSource={demand} xName="week" yName="demand" type="Column" fill="#7E56D8" />
                  </SeriesCollectionDirective>
                </ChartComponent>
              )}
            />
            <TabItemDirective
              header={{ text: 'Suppliers' }}
              content={() => (
                <div style={{ padding: '0.75rem 0' }}>
                  <p>
                    <strong>Preferred supplier:</strong> {item.preferredSupplierName}
                  </p>
                  <p className="agm-muted">Lead time {item.leadTimeDays} days · Unit cost {formatCurrency(item.unitCost)}</p>
                  <ButtonComponent
                    cssClass="e-link"
                    onClick={() =>
                      navigate(`/suppliers?search=${encodeURIComponent(item.preferredSupplierName)}`)
                    }
                  >
                    Open supplier directory →
                  </ButtonComponent>
                </div>
              )}
            />
          </TabItemsDirective>
        </TabComponent>
      </div>
      <ToastComponent ref={toastRef} position={{ X: 'Right', Y: 'Bottom' }} />
    </div>
  )
}
