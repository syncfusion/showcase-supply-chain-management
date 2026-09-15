import { useEffect, useRef, useState } from 'react'
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
  Reorder,
  Resize,
  Search,
  Page,
} from '@syncfusion/ej2-react-grids'
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject as ChartInject,
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
import { procurementRepository } from '../../shared/services/repositories'
import type { PurchaseOrder } from '../../shared/models/types'
import { formatCompactCurrency, formatCurrency, formatGridCurrency, formatNumber } from '../../shared/utils/format'
import { usePageShowcase } from '../../shared/showcase/usePageShowcase'
import { useSettings } from '../../app/providers/SettingsProvider'

const showcase = [
  {
    name: 'React Data Grid',
    features: ['DataManager + UrlAdaptor', 'Grouping', 'Aggregates', 'Conditional formatting', 'Export', 'Saved views'],
  },
  { name: 'Charts', features: ['PO spend visualizations', 'Status distribution'] },
]

const poStatusColors: Record<string, string> = {
  'Draft': '#9CA3AF',
  'Approval': '#F59E0B',
  'Issued': '#2563EB',
  'In Transit': '#06B6D4',
  'Received': '#22C55E',
  'Supplier Confirmed': '#7C3AED',
}

export function ProcurementPage() {
  const { syncfusionTheme } = useSettings()
  usePageShowcase(showcase)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [status, setStatus] = useState(params.get('status') ?? '')
  const [aggregates, setAggregates] = useState<Record<string, number>>({})
  const [chartRows, setChartRows] = useState<PurchaseOrder[]>([])
  const [gridKey, setGridKey] = useState(0)
  const gridRef = useRef<GridComponent>(null)
  const tooltipRef = useRef<TooltipComponent>(null)

  useEffect(() => {
    procurementRepository
      .list({ skip: 0, take: 60, status: status || undefined, sort: 'Value', sortDirection: 'desc' })
      .then((res) => {
        setAggregates(res.aggregates ?? {})
        setChartRows(res.items)
      })
    setGridKey((k) => k + 1)
  }, [status])

  const byStatus = Object.entries(
    chartRows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1
      return acc
    }, {}),
  ).map(([s, count]) => ({ status: s, count }))

  const byMonth = chartRows.slice(0, 12).map((r, i) => ({ month: `M${i + 1}`, value: r.value }))
  const getStatusStyle = (statusText: string) => {
    const bgColor = poStatusColors[statusText] ?? '#64748B'
    return {
      backgroundColor: bgColor,
      color: '#ffffff',
    }
  }

  const beforeRender = (args: TooltipEventArgs) => {
    if (!args.target.classList.contains('e-rowcell')) return

    const field = args.target.getAttribute('data-field')
    if (field !== 'plant') {
      args.cancel = true
      return
    }

    const text = args.target.textContent?.trim() ?? ''
    if (tooltipRef.current) {
      tooltipRef.current.content = text
    }
  }

  return (
    <div>
      <div className="agm-page-header">
        <div>
          <h1>Procurement</h1>
          <p>Purchase orders, approval workflows, supplier commitments, and delivery risk across the procurement lifecycle.</p>
        </div>
      </div>

      <div className="agm-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0,1fr))' }}>
        <div className="agm-kpi">
          <div className="agm-kpi__label">Open PO value</div>
          <div className="agm-kpi__value">{formatCurrency(aggregates.openValue ?? 0)}</div>
        </div>
        <div className="agm-kpi">
          <div className="agm-kpi__label">Awaiting approval</div>
          <div className="agm-kpi__value">{formatNumber(aggregates.awaitingApproval ?? 0)}</div>
        </div>
        <div className="agm-kpi">
          <div className="agm-kpi__label">Late / at risk</div>
          <div className="agm-kpi__value">{formatNumber(aggregates.late ?? 0)}</div>
        </div>
        <div className="agm-kpi">
          <div className="agm-kpi__label">Binding</div>
          <div className="agm-kpi__value" style={{ fontSize: '1rem' }}>
            UrlAdaptor
          </div>
        </div>
      </div>

      <div className="agm-grid-2">
        <div className="agm-panel" style={{ position: 'relative' }}>
          <h2 className="agm-panel__title">PO spend sample</h2>
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#7E56D8',
              background: 'rgba(126, 86, 216, 0.12)',
              padding: '0.2rem 0.5rem',
              borderRadius: '999px',
            }}
          >
            M = Month
          </div>
          <ChartComponent
            height="240px"
            primaryXAxis={{ valueType: 'Category' }}
            primaryYAxis={{ labelFormat: 'C0', minimum: 500000 }}
            tooltip={{ enable: true, format: '${point.x}: ${point.y}' }}
            axisLabelRender={(args) => {
              if (args.axis.name === 'primaryYAxis') args.text = formatCompactCurrency(Number(args.value))
            }}
            theme={syncfusionTheme}
          >
            <ChartInject services={[ColumnSeries, Category, Legend, Tooltip]} />
            <SeriesCollectionDirective>
              <SeriesDirective dataSource={byMonth} xName="month" yName="value" type="Column" name="Spend" fill="#7E56D8" />
            </SeriesCollectionDirective>
          </ChartComponent>
        </div>
        <div className="agm-panel">
          <h2 className="agm-panel__title">PO status</h2>
          <AccumulationChartComponent
            height="240px"
            legendSettings={{ visible: true, position: 'Bottom' }}
            tooltip={{ enable: true, format: '${point.x}: ${point.y}' }}
            enableSmartLabels={true}
            theme={syncfusionTheme}
          >
            <ChartInject services={[PieSeries, AccumulationLegend, AccumulationTooltip, AccumulationDataLabel]} />
            <AccumulationSeriesCollectionDirective>
              <AccumulationSeriesDirective
                dataSource={byStatus.map((item) => ({
                  ...item,
                  color: poStatusColors[item.status] ?? '#64748B',
                }))}
                xName="status"
                yName="count"
                innerRadius="45%"
                pointColorMapping="color"
                dataLabel={{
                  visible: true,
                  position: 'Outside',
                  connectorStyle: { length: '15px' },
                  template: '<div>${point.y}</div>',
                }}
              />
            </AccumulationSeriesCollectionDirective>
          </AccumulationChartComponent>
        </div>
      </div>

      <div className="agm-panel">
        <TooltipComponent ref={tooltipRef} target=".e-rowcell" beforeRender={beforeRender}>
          <GridComponent
            ref={gridRef}
            id="Grid"
            key={gridKey}
            dataSource={chartRows}
            allowPaging
            allowSorting
            allowFiltering
            allowGrouping
            allowExcelExport
            allowPdfExport
            allowReordering
            allowResizing
            showColumnChooser
            height={420}
            pageSettings={{ pageSize: 12 }}
            filterSettings={{ type: 'Menu' }}
            groupSettings={{ columns: ['supplierName'] }}
            toolbar={['Search', 'ColumnChooser', 'ExcelExport', 'PdfExport']}
            toolbarClick={(args) => {
              if (args.item.id === 'Grid_excelexport') {
                gridRef.current?.excelExport()
              } else if (args.item.id === 'Grid_pdfexport') {
                gridRef.current?.pdfExport()
              }
            }}
            frozenColumns={1}
            contextMenuItems={['SortAscending', 'SortDescending', 'AutoFit']}
            recordDoubleClick={(e) => {
              const row = e.rowData as PurchaseOrder | undefined
              if (row?.id) navigate(`/procurement/${row.id}`)
            }}
            queryCellInfo={(args) => {
              if (args.cell) {
                const field = args.column?.field
                if (field) {
                  args.cell.setAttribute('data-field', String(field))
                }
              }
              if (args.column?.field === 'value' && args.cell) {
                const row = args.data as PurchaseOrder
                args.cell.innerText = formatGridCurrency(Number(row.value), row.currency || 'USD')
              }
              if ((args.column?.field === 'plant' || args.column?.field === 'status') && args.cell) {
                args.cell.setAttribute('title', String((args.data as PurchaseOrder)[args.column.field as 'plant' | 'status'] ?? ''))
              }
              if (args.column?.field === 'status' && args.cell) {
                const statusText = String(args.data.status)
                const bgColor = poStatusColors[statusText] ?? '#64748B'
                args.cell.innerHTML = `<span class="agm-status" style="background-color: ${bgColor}; color: white;">${statusText}</span>`
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
                Reorder,
                Resize,
                Search,
                Page,
              ]}
            />
            <ColumnsDirective>
              <ColumnDirective field="number" headerText="PO Number" width={140} type="string" />
              <ColumnDirective field="supplierName" headerText="Supplier" width={180} type="string" />
              <ColumnDirective field="plant" headerText="Plant" width={160} type="string" />
              <ColumnDirective field="createdDate" headerText="Created Date" format={'MM/dd/yyyy'} width={130} type="date" />
              <ColumnDirective field="requiredDate" headerText="Required Date" format={'MM/dd/yyyy'} width={110} type="date" />
              <ColumnDirective field="value" headerText="Value" width={120} type="number" format="C0" textAlign="Right" />
              <ColumnDirective field="currency" headerText="Currency" width={110} type="string" />
              <ColumnDirective field="buyer" headerText="Buyer" width={110} type="string" />
              <ColumnDirective field="items" headerText="Items" width={100} type="number" textAlign="Right" />
              <ColumnDirective field="status" headerText="Status" width={160} type="string" />
              <ColumnDirective field="deliveryStatus" headerText="Delivery" width={120} type="string" />
              <ColumnDirective field="risk" headerText="Risk" width={110} type="string" />
            </ColumnsDirective>
            <AggregatesDirective>
              <AggregateDirective>
                <AggregateColumnsDirective>
                  <AggregateColumnDirective field="value" type="Sum" format="C0" footerTemplate="Total: ${Sum}" />
                </AggregateColumnsDirective>
              </AggregateDirective>
            </AggregatesDirective>
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
          Double-click a row to open PO detail (Stepper + documents).
        </p>
      </div>
    </div>
  )
}
