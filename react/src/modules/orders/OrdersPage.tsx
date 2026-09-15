import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { TooltipComponent, type TooltipEventArgs } from '@syncfusion/ej2-react-popups'
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Filter,
  Sort,
  Toolbar,
  ExcelExport,
  PdfExport,
  ColumnChooser,
  Aggregate,
  AggregatesDirective,
  AggregateDirective,
  AggregateColumnsDirective,
  AggregateColumnDirective,
  Group,
  Freeze,
  ContextMenu,
  Search,
  Page,
  Reorder,
  Resize,
} from '@syncfusion/ej2-react-grids'
import { createRemoteDataManager } from '../../shared/services/dataManager'
import { orderRepository } from '../../shared/services/repositories'
import type { SalesOrder } from '../../shared/models/types'
import { formatCurrency, formatGridCurrency, formatNumber } from '../../shared/utils/format'
import { usePageShowcase } from '../../shared/showcase/usePageShowcase'

const showcase = [
  {
    name: 'React Data Grid',
    features: [
      'DataManager + UrlAdaptor',
      'Server-side paging/sort/filter',
      'Grouping / freezing / aggregates',
      'URL-driven risk filter',
      'Saved views',
      'Row → order detail navigation',
    ],
  },
]

function buildUrl(search: string, risk: string) {
  const usp = new URLSearchParams()
  if (search) usp.set('search', search)
  if (risk) usp.set('risk', risk)
  const q = usp.toString()
  return `${import.meta.env.VITE_API_BASE_URL}/api/datamanager/orders${q ? `?${q}` : ''}`
}

export function OrdersPage() {
  usePageShowcase(showcase)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('search') ?? '')
  const risk = params.get('risk') ?? ''
  const [aggregates, setAggregates] = useState<Record<string, number>>({})
  const [gridKey, setGridKey] = useState(0)
  const gridRef = useRef<GridComponent>(null)
  const tooltipRef = useRef<TooltipComponent>(null)
  const remote = useMemo(() => createRemoteDataManager(buildUrl(search, risk)), [search, risk])

  useEffect(() => {
    orderRepository
      .list({ skip: 0, take: 1, search: search || undefined, risk: risk || undefined })
      .then((res) => setAggregates(res.aggregates ?? {}))
    setGridKey((k) => k + 1)
  }, [search, risk])

  const beforeRender = (args: TooltipEventArgs) => {
    if (!args.target.classList.contains('e-rowcell')) return

    const field = args.target.getAttribute('data-field')
    if (field !== 'warehouseName') {
      args.cancel = true
      return
    }

    if (tooltipRef.current) {
      tooltipRef.current.content = args.target.textContent?.trim() ?? ''
    }
  }

  return (
    <div>
      <div className="agm-page-header">
        <div>
          <h1>Customer Orders & Fulfillment</h1>
          <p>Order intake, fulfillment progress, delivery commitments, and customer service risk from placement to shipment.</p>
        </div>
      </div>

      <div className="agm-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
        <div className="agm-kpi">
          <div className="agm-kpi__label">Order value</div>
          <div className="agm-kpi__value">{formatCurrency(aggregates.totalValue ?? 0)}</div>
        </div>
        <div className="agm-kpi">
          <div className="agm-kpi__label">Orders at risk</div>
          <div className="agm-kpi__value">{formatNumber(aggregates.atRisk ?? 0)}</div>
        </div>
        <div className="agm-kpi">
          <div className="agm-kpi__label">Data source</div>
          <div className="agm-kpi__value" style={{ fontSize: '1rem' }}>
            UrlAdaptor
          </div>
        </div>
      </div>

      <div className="agm-panel">
        <TooltipComponent ref={tooltipRef} target=".e-rowcell" beforeRender={beforeRender}>
          <GridComponent
            ref={gridRef}
            id='Grid'
            key={gridKey}
            dataSource={remote.manager}
            query={remote.query}
            allowPaging
            allowSorting
            allowFiltering
            allowGrouping
            allowExcelExport
            allowPdfExport
            allowReordering
            allowResizing
            showColumnChooser
            height={480}
            pageSettings={{ pageSize: 15 }}
            toolbar={['Search', 'ColumnChooser', 'ExcelExport', 'PdfExport']}
            toolbarClick={(args) => {
              if (args.item.id === 'Grid_excelexport' && gridRef.current) {
                gridRef.current.excelExport()
              } else if (args.item.id === 'Grid_pdfexport' && gridRef.current) {
                gridRef.current.pdfExport()
              }
            }}
            frozenColumns={1}
            contextMenuItems={['SortAscending', 'SortDescending', 'AutoFit']}
            recordClick={(e) => {
              const row = e.rowData as SalesOrder | undefined
              if (row?.id) navigate(`/orders/${row.id}`)
            }}
            queryCellInfo={(args) => {
              if (args.cell) {
                const field = args.column?.field
                if (field) {
                  args.cell.setAttribute('data-field', String(field))
                }
              }
              if (args.column?.field === 'value' && args.cell) {
                args.cell.innerText = formatGridCurrency(Number(args.data.value))
              }
              if (args.column?.field === 'risk' && args.cell) {
                const value = String(args.data.risk)
                const cls = value === 'High' ? 'critical' : value === 'Moderate' ? 'warning' : 'healthy'
                args.cell.innerHTML = `<span class="agm-status ${cls}">${value}</span>`
              }
            }}
          >
          <Inject
            services={[
              Filter,
              Sort,
              Toolbar,
              ExcelExport,
              PdfExport,
              ColumnChooser,
              Aggregate,
              Group,
              Freeze,
              ContextMenu,
              Search,
              Page,
              Reorder,
              Resize,
            ]}
          />
          <ColumnsDirective>
            <ColumnDirective field="number" headerText="Order" width={140} />
            <ColumnDirective field="customerName" headerText="Customer" width={170} />
            <ColumnDirective field="region" headerText="Region" width={120} />
            <ColumnDirective field="orderDate" headerText="Order date" width={110} type="date" format="MM/dd/yyyy" />
            <ColumnDirective field="requestedDate" headerText="Requested" width={110} type="date" format="MM/dd/yyyy" />
            <ColumnDirective field="value" headerText="Value" width={130} type="number" format="C0" textAlign="Right" />
            <ColumnDirective field="warehouseName" headerText="Warehouse" width={180} />
            <ColumnDirective field="fulfillmentPct" headerText="Fulfillment" width={110} type="number" format="P0" textAlign="Right" />
            <ColumnDirective field="shipmentId" headerText="Shipment" width={120} />
            <ColumnDirective field="priority" headerText="Priority" width={100} />
            <ColumnDirective field="status" headerText="Status" width={110} />
            <ColumnDirective field="risk" headerText="Risk" width={100} />
          </ColumnsDirective>
          <AggregatesDirective>
            <AggregateDirective>
              <AggregateColumnsDirective>
                <AggregateColumnDirective field="value" type="Sum" format="C0" footerTemplate="${Sum}" />
              </AggregateColumnsDirective>
            </AggregateDirective>
          </AggregatesDirective>
          </GridComponent>
        </TooltipComponent>
      </div>
    </div>
  )
}
