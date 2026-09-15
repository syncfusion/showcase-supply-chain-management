import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ButtonComponent } from '@syncfusion/ej2-react-buttons'
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  ColumnSeries,
  Category,
  Legend,
  Tooltip,
  AccumulationChartComponent,
  AccumulationSeriesCollectionDirective,
  AccumulationSeriesDirective,
  PieSeries,
  AccumulationLegend,
  AccumulationTooltip,
  AccumulationDataLabel,
} from '@syncfusion/ej2-react-charts'
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject as GridInject,
  Filter,
  Sort,
  Toolbar,
  ExcelExport,
  PdfExport,
  ColumnChooser,
  Reorder,
  Resize,
  Freeze,
  ContextMenu,
  Search,
  Page,
  Edit,
  VirtualScroll
} from '@syncfusion/ej2-react-grids'
import { ToastComponent } from '@syncfusion/ej2-react-notifications'
import { inventoryRepository } from '../../shared/services/repositories'
import { createRemoteDataManager } from '../../shared/services/dataManager'
import type { InventoryRecord } from '../../shared/models/types'
import { formatCompactCurrency, formatCurrency, formatNumber } from '../../shared/utils/format'
import { usePageShowcase } from '../../shared/showcase/usePageShowcase'
import { SavedViewsToolbar } from '../../shared/components/SavedViewsToolbar'
import type { SavedView } from '../../shared/services/savedViews'
import { useSettings } from '../../app/providers/SettingsProvider'
import { TooltipComponent, type TooltipEventArgs } from '@syncfusion/ej2-react-popups';

const showcase = [
  {
    name: 'React Data Grid (Explorer)',
    features: [
      'DataManager + UrlAdaptor (remote)',
      'Virtual scrolling',
      'Server-side paging / sort / filter / search',
      'Frozen columns',
      'Column chooser / reorder / resize',
      'Excel & PDF export',
      'Templates & conditional formatting',
      'Saved views',
    ],
    docsUrl: 'https://ej2.syncfusion.com/react/documentation/grid/data-binding/remote-data',
  },
  {
    name: 'React Data Grid (Adjustment)',
    features: ['Batch editing', 'Validation', 'Dirty-cell indication', 'Calculated inventory value'],
  },
  { name: 'Charts', features: ['Column chart', 'Doughnut', 'Interactive legend', 'Tooltip'] },
]

function statusClass(status: string) {
  if (status === 'Healthy') return 'healthy'
  if (status === 'Below Safety' || status === 'Excess') return 'warning'
  if (status === 'Out of Stock') return 'critical'
  return ''
}

const inventoryStatusColors: Record<string, string> = {
  Healthy: '#16A34A',
  'Below Safety': '#F59E0B',
  Excess: '#7C3AED',
  'Out of Stock': '#DC2626',
}

function buildUrl(search: string, warehouse: string, status: string) {
  const usp = new URLSearchParams()
  if (search) usp.set('search', search)
  if (warehouse) usp.set('warehouse', warehouse)
  if (status) usp.set('status', status)
  const q = usp.toString()
  return `${import.meta.env.VITE_API_BASE_URL}/api/datamanager/inventory${q ? `?${q}` : ''}`
}

export function InventoryPage() {
  const { syncfusionTheme } = useSettings()
  usePageShowcase(showcase)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('search') ?? '')
  const [warehouse, setWarehouse] = useState(params.get('warehouse') ?? '')
  const [status, setStatus] = useState(params.get('status') ?? '')
  const [aggregates, setAggregates] = useState<Record<string, number>>({})
  const [charts, setCharts] = useState<{
    byWarehouse: { warehouse: string; value: number }[]
    byCategory: { category: string; value: number }[]
    byStatus: { status: string; count: number }[]
  } | null>(null)
  const [mode, setMode] = useState<'explorer' | 'adjustment'>('explorer')
  const [adjustmentRows, setAdjustmentRows] = useState<InventoryRecord[]>([])
  const [gridKey, setGridKey] = useState(0)
  const toastRef = useRef<ToastComponent>(null)
  const adjustGridRef = useRef<GridComponent>(null)
  const explorerRef = useRef<GridComponent>(null)

  let tooltipInstance: TooltipComponent | null;
;

  // Event triggered before rendering the tooltip on the target element
  const beforeRender = (args: TooltipEventArgs) => {
    if (args.target.classList.contains('e-rowcell')) {
      // Set the tooltip content to the text inside the current grid cell
      (tooltipInstance as TooltipComponent).content = args.target.innerText;
    }
  };

  const remote = useMemo(() => createRemoteDataManager(buildUrl(search, warehouse, status)), [search, warehouse, status])

  useEffect(() => {
    inventoryRepository.getCharts().then(setCharts).catch(() => undefined)
  }, [])

  useEffect(() => {
    inventoryRepository
      .getAggregates({ search: search || undefined, warehouse: warehouse || undefined, status: status || undefined })
      .then((res) => setAggregates(res.aggregates ?? {}))
      .catch(() => undefined)
    setGridKey((k) => k + 1)
  }, [search, warehouse, status])

  useEffect(() => {
    if (mode !== 'adjustment') return
    inventoryRepository.getAdjustments().then((res) => setAdjustmentRows(res.items))
  }, [mode])

  const syncUrl = (next: { search?: string; warehouse?: string; status?: string }) => {
    const p = new URLSearchParams(params)
    const entries: [string, string | undefined][] = [
      ['search', next.search ?? search],
      ['warehouse', next.warehouse ?? warehouse],
      ['status', next.status ?? status],
    ]
    entries.forEach(([k, v]) => {
      if (v) p.set(k, v)
      else p.delete(k)
    })
    setParams(p)
  }

  const currentViewState: SavedView['state'] = {
    search,
    filters: { warehouse, status },
  }

  const shortLabel = (value: string) => value.split(/\s+/)[0] || value

  return (
    <div>
      <div className="agm-page-header">
        <div>
          <h1>Inventory Management</h1>
          <p>Stock levels, availability, safety thresholds, and warehouse inventory health across the supply network.</p>
        </div>
      </div>

      <div className="agm-kpi-grid" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
        {[
          ['Total value', formatCurrency(aggregates.totalValue ?? 0)],
          ['Available units', formatNumber(aggregates.available ?? 0)],
          ['Reserved units', formatNumber(aggregates.reserved ?? 0)],
          ['Below safety (units)', formatNumber(aggregates.belowSafety ?? 0)],
          ['Out of stock (units)', formatNumber(aggregates.outOfStock ?? 0)],
          ['Excess (units)', formatNumber(aggregates.excess ?? 0)],
        ].map(([label, value]) => (
          <div className="agm-kpi" key={label}>
            <div className="agm-kpi__label">{label}</div>
            <div className="agm-kpi__value" style={{ fontSize: '1.15rem' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {charts && (
        <div className="agm-grid-3">
          <div className="agm-panel agm-panel--chart">
            <h2 className="agm-panel__title">Value by warehouse</h2>
            <ChartComponent
              height="220px"
              primaryXAxis={{ valueType: 'Category', labelRotation: -35, labelIntersectAction: 'Hide' }}
              primaryYAxis={{ labelFormat: 'C0', title: 'Value', minimum: 2600000000, maximum: 2850000000 }}
              tooltip={{ enable: true }}
              tooltipRender={(args) => {
                const point = args?.point
                if (point) {
                  args.text = `${point.x}: ${formatCompactCurrency(Number(point.y))}`
                }
              }}
              axisLabelRender={(args) => {
                if (args.axis.name === 'primaryXAxis') args.text = shortLabel(String(args.text ?? ''))
                if (args.axis.name === 'primaryYAxis') args.text = formatCompactCurrency(Number(args.value))
              }}
              theme={syncfusionTheme}
            >
              <Inject services={[ColumnSeries, Category, Legend, Tooltip]} />
              <SeriesCollectionDirective>
                <SeriesDirective dataSource={charts.byWarehouse} xName="warehouse" yName="value" type="Column" fill="#7E56D8" />
              </SeriesCollectionDirective>
            </ChartComponent>
          </div>
          <div className="agm-panel agm-panel--chart">
            <h2 className="agm-panel__title">Value by category</h2>
            <ChartComponent
              height="220px"
              primaryXAxis={{ valueType: 'Category', labelRotation: -25 }}
              primaryYAxis={{ labelFormat: 'C0', title: 'Value', minimum: 4000000000 }}
              tooltip={{ enable: true }}
              tooltipRender={(args) => {
                const point = args?.point
                if (point) {
                  args.text = `${point.x}: ${formatCompactCurrency(Number(point.y))}`
                }
              }}
              axisLabelRender={(args) => {
                if (args.axis.name === 'primaryYAxis') args.text = formatCompactCurrency(Number(args.value))
              }}
              theme={syncfusionTheme}
            >
              <Inject services={[ColumnSeries, Category, Tooltip]} />
              <SeriesCollectionDirective>
                <SeriesDirective dataSource={charts.byCategory} xName="category" yName="value" type="Column" fill="#088AB2" />
              </SeriesCollectionDirective>
            </ChartComponent>
          </div>
          <div className="agm-panel agm-panel--chart">
            <h2 className="agm-panel__title">Stock status</h2>
            <AccumulationChartComponent
              height="220px"
              legendSettings={{ visible: true, position: 'Bottom' }}
              tooltip={{ enable: true }}
              tooltipRender={(args) => {
                const point = args?.point as any
                if (point) {
                  const formatted = new Intl.NumberFormat('en-US').format(point.y)
                  args.text = `${point.x}: ${formatted} units`
                }
              }}
              enableSmartLabels={true}
              theme={syncfusionTheme}
            >
              <Inject services={[PieSeries, AccumulationLegend, AccumulationTooltip, AccumulationDataLabel]} />
              <AccumulationSeriesCollectionDirective>
                <AccumulationSeriesDirective
                  dataSource={charts.byStatus.map((item) => {
                    const formatted = new Intl.NumberFormat('en-US').format(item.count)
                    return {
                      ...item,
                      color: inventoryStatusColors[item.status] ?? '#64748B',
                      displayValue: `${formatted} units`,
                    }
                  })}
                  xName="status"
                  yName="count"
                  pointColorMapping="color"
                  innerRadius="50%"
                  dataLabel={{
                    visible: true,
                    position: 'Outside',
                    connectorStyle: { length: '6px' },
                    name: 'displayValue',
                  }}
                />
              </AccumulationSeriesCollectionDirective>
            </AccumulationChartComponent>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <SavedViewsToolbar
          module="inventory"
          currentState={currentViewState}
          gridRef={explorerRef}
          onApply={(state) => {
            setSearch(state.search ?? '')
            setWarehouse(state.filters?.warehouse ?? '')
            setStatus(state.filters?.status ?? '')
            syncUrl({
              search: state.search ?? '',
              warehouse: state.filters?.warehouse ?? '',
              status: state.filters?.status ?? '',
            })
          }}
          onReset={() => {
            setSearch('')
            setWarehouse('')
            setStatus('')
            setParams(new URLSearchParams())
          }}
        />
        <ButtonComponent cssClass={'e-primary'} onClick={() => setMode(m => m === 'explorer' ? 'adjustment' : 'explorer')}>
          {mode === 'explorer' ? "Adjustment Workspace" : "Inventory Explorer"}
        </ButtonComponent>
      </div>

      {mode === 'explorer' && (
        <div className="agm-panel">
          <TooltipComponent 
            ref={(t: TooltipComponent | null) => { tooltipInstance = t }} 
            target='.inventory-tooltip-cell' 
            beforeRender={beforeRender}
          >
            <GridComponent
              id="Grid"
              key={gridKey}
              ref={explorerRef}
              dataSource={remote.manager}
              query={remote.query}
              enableVirtualization
              pageSettings={{ pageSize: 50 }}
              height={480}
              allowSorting
              allowFiltering
              allowExcelExport
              allowPdfExport
              allowReordering
              allowResizing
              showColumnChooser
              filterSettings={{ type: 'Excel' }}
              toolbar={['Search', 'ColumnChooser', 'ExcelExport', 'PdfExport']}
              toolbarClick={(args) => {
                if (args.item.id === 'Grid_excelexport') {
                  explorerRef.current?.excelExport()
                } else if (args.item.id === 'Grid_pdfexport') {
                  explorerRef.current?.pdfExport()
                }
              }}
              frozenColumns={2}
              contextMenuItems={['AutoFit', 'AutoFitAll', 'SortAscending', 'SortDescending', 'Copy']}
              recordClick={(e) => {
                const row = e.rowData as InventoryRecord | undefined
                if (row?.id) navigate(`/inventory/${row.id}`)
              }}
              queryCellInfo={(args) => {
                if (
                  args.column?.field === 'productName' ||
                  args.column?.field === 'warehouseName' ||
                  args.column?.field === 'preferredSupplierName'
                ) {
                  args.cell?.classList.add('inventory-tooltip-cell')
                }
                if (args.column?.field === 'status' && args.cell) {
                  const statusText = String(args.data.status)
                  const statusColor = inventoryStatusColors[statusText] ?? '#64748B'
                  args.cell.innerHTML = `<span class="agm-status ${statusClass(statusText)}" style="background-color: ${statusColor}; border-color: ${statusColor}; color: #FFFFFF;">${statusText}</span>`
                }
              }}
            >
              <GridInject
                services={[
                  Filter,
                  Sort,
                  Toolbar,
                  ExcelExport,
                  PdfExport,
                  ColumnChooser,
                  Reorder,
                  Resize,
                  Freeze,
                  ContextMenu,
                  Search,
                  VirtualScroll,
                ]}
              />
              <ColumnsDirective>
                <ColumnDirective field="sku" headerText="SKU" width={130} isFrozen />
                <ColumnDirective field="productName" headerText="Product" width={220} isFrozen />
                <ColumnDirective field="category" headerText="Category" width={120} />
                <ColumnDirective field="warehouseName" headerText="Warehouse" width={180} />
                <ColumnDirective field="bin" headerText="Bin" width={110} />
                <ColumnDirective field="quantity" headerText="Qty" width={90} type="number" format="N0" textAlign="Right" />
                <ColumnDirective field="available" headerText="Available" width={100} type="number" format="N0" textAlign="Right" />
                <ColumnDirective field="reserved" headerText="Reserved" width={100} type="number" format="N0" textAlign="Right" />
                <ColumnDirective field="safetyStock" headerText="Safety" width={90} type="number" format="N0" textAlign="Right" />
                <ColumnDirective field="reorderPoint" headerText="Reorder" width={90} type="number" format="N0" textAlign="Right" />
                <ColumnDirective field="unitCost" headerText="Unit cost" width={110} type="number" format="C2" textAlign="Right" />
                <ColumnDirective field="inventoryValue" headerText="Value" width={130} type="number" format="C0" textAlign="Right" />
                <ColumnDirective field="status" headerText="Status" width={130} />
                <ColumnDirective field="preferredSupplierName" headerText="Supplier" width={180} />
                <ColumnDirective field="leadTimeDays" headerText="Lead days" width={100} type="number" format="N0" textAlign="Right" />
              </ColumnsDirective>
            </GridComponent>
          </TooltipComponent>
          <p
            className="agm-muted"
            style={{
              marginTop: '0.5rem',
              color: 'var(--agm-accent)',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.01em',
            }}
          >
            Click a row for inventory detail.
          </p>
        </div>
      )}

      {mode === 'adjustment' && (
        <div className="agm-panel">
          <h2 className="agm-panel__title">Inventory adjustment workspace</h2>
          
          <GridComponent
            ref={adjustGridRef}
            dataSource={adjustmentRows}
            height={460}
            editSettings={{ allowEditing: true, allowAdding: true, allowDeleting: true, mode: 'Batch' }}
            toolbar={['Add', 'Delete', 'Update', 'Cancel', 'Search']}
            allowSorting
            allowFiltering
            cellSave={(args) => {
              if (args.columnName === 'quantity' || args.columnName === 'unitCost') {
                const qty = Number(args.columnName === 'quantity' ? args.value : args.rowData.quantity)
                const cost = Number(args.columnName === 'unitCost' ? args.value : args.rowData.unitCost)
                args.rowData.inventoryValue = Math.round(qty * cost * 100) / 100
              }
            }}
          >
            <GridInject services={[Edit, Filter, Sort, Toolbar, Search, Page]} />
            <ColumnsDirective>
              <ColumnDirective field="sku" headerText="SKU" width={120} isPrimaryKey />
              <ColumnDirective field="productName" headerText="Product" width={200} allowEditing={false} clipMode="EllipsisWithTooltip" />
              <ColumnDirective field="warehouseName" headerText="Warehouse" width={160} allowEditing={false} clipMode="EllipsisWithTooltip" />
              <ColumnDirective field="quantity" headerText="Qty" width={90} type="number" format="N0" editType="numericedit" validationRules={{ required: true, min: 0 }} />
              <ColumnDirective field="bin" headerText="Bin" width={110} />
              <ColumnDirective field="safetyStock" headerText="Safety" width={90} type="number" format="N0" editType="numericedit" />
              <ColumnDirective field="reorderPoint" headerText="Reorder" width={90} type="number" format="N0" editType="numericedit" />
              <ColumnDirective field="unitCost" headerText="Unit cost" width={110} type="number" format="C2" editType="numericedit" />
              <ColumnDirective field="inventoryValue" headerText="Value" width={130} type="number" format="C0" allowEditing={false} />
              <ColumnDirective field="preferredSupplierName" headerText="Preferred supplier" width={180} editType="stringedit" />
            </ColumnsDirective>
          </GridComponent>
          <div style={{ marginTop: '0.75rem' }}>
            <ButtonComponent
              cssClass="e-primary"
              onClick={async () => {
                const changes = adjustGridRef.current?.getBatchChanges?.() as { changedRecords?: InventoryRecord[] }
                const rows = changes?.changedRecords ?? adjustmentRows.slice(0, 5)
                const result = await inventoryRepository.saveAdjustments(
                  rows.map((r) => ({
                    id: r.id,
                    quantity: r.quantity,
                    bin: r.bin,
                    safetyStock: r.safetyStock,
                    reorderPoint: r.reorderPoint,
                    preferredSupplierId: r.preferredSupplierId,
                  })),
                )
                toastRef.current?.show({ title: 'Saved', content: result.message, cssClass: 'e-toast-success' })
              }}
            >
              Save adjustments
            </ButtonComponent>
          </div>
        </div>
      )}

      <ToastComponent ref={toastRef} position={{ X: 'Right', Y: 'Bottom' }} />
    </div>
  )
}
