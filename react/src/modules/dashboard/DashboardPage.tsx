import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ButtonComponent } from '@syncfusion/ej2-react-buttons'
import { DateRangePickerComponent } from '@syncfusion/ej2-react-calendars'
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns'
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  LineSeries,
  Legend,
  Tooltip,
  Crosshair,
  Export,
  Category,
  AccumulationChartComponent,
  AccumulationSeriesCollectionDirective,
  AccumulationSeriesDirective,
  AccumulationLegend,
  AccumulationTooltip,
  PieSeries,
  AccumulationDataLabel,
} from '@syncfusion/ej2-react-charts'
import {
  MapsComponent,
  LayersDirective,
  LayerDirective,
  Inject as MapsInject,
  Marker,
  MapsTooltip,
  NavigationLine,
  Zoom as MapsZoom,
  Selection,
} from '@syncfusion/ej2-react-maps'
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
} from '@syncfusion/ej2-react-grids'
import { TooltipComponent, type TooltipEventArgs } from '@syncfusion/ej2-react-popups'
import { dashboardRepository, metaRepository } from '../../shared/services/repositories'
import type {
  DashboardKpis,
  ExceptionItem,
  FilterOptions,
  RiskBucket,
  TrendPoint,
  Warehouse,
} from '../../shared/models/types'
import { formatCompactCurrency, formatCurrency, formatDelta, formatNumber, formatPercent } from '../../shared/utils/format'
import { usePageShowcase } from '../../shared/showcase/usePageShowcase'
import { useSettings } from '../../app/providers/SettingsProvider'
import { loadWorldMap } from '../../shared/services/worldMap'

// Utility: Detect if dark theme is active
function isDarkTheme(theme: string): boolean {
  return theme.toLowerCase().includes('dark')
}

// Utility: Get theme-aware shape settings for the map layer
function getThemeAwareShapeSettings(theme: string) {
  const dark = isDarkTheme(theme)
  return {
    fill: dark ? '#1F2937' : '#EAECF0',
    border: {
      width: 0.5,
      color: dark ? '#374151' : '#D0D5DD',
    },
  }
}

// Utility: Get theme-aware navigation line colors
function getNavigationLineColor(mode: string, theme: string): string {
  const dark = isDarkTheme(theme)
  if (mode === 'Air') {
    return dark ? '#06B6D4' : '#088AB2' // Cyan for dark, blue for light
  }
  return dark ? '#A78BFA' : '#7E56D8' // Lighter purple for dark, purple for light
}

function severityClass(severity: string) {
  if (/critical/i.test(severity)) return 'critical'
  if (/high/i.test(severity)) return 'warning'
  return 'healthy'
}

const showcase = [
  {
    name: 'React Charts',
    features: ['Multiple series', 'Zoom & pan', 'Tooltip', 'Crosshair', 'Legend', 'Export'],
    docsUrl: 'https://ej2.syncfusion.com/react/documentation/chart/getting-started',
  },
  {
    name: 'React Maps',
    features: ['Markers', 'Tooltips', 'Zoom', 'Navigation lines', 'Selection'],
    docsUrl: 'https://ej2.syncfusion.com/react/documentation/maps/getting-started',
  },
  {
    name: 'React Data Grid',
    features: ['Sorting', 'Filtering', 'Search', 'Column chooser', 'Export', 'Frozen columns', 'Exception drill-through'],
    docsUrl: 'https://ej2.syncfusion.com/react/documentation/grid/getting-started',
  },
  {
    name: 'DateRangePicker / DropDownList / MultiSelect',
    features: ['Header filters drive all widgets'],
  },
]

export function DashboardPage() {
  const { syncfusionTheme } = useSettings()
  usePageShowcase(showcase)
  const navigate = useNavigate()
  const [filters, setFilters] = useState<FilterOptions | null>(null)
  
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null)
  const [region, setRegion] = useState<string>('')
  const [warehouse, setWarehouse] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [kpis, setKpis] = useState<DashboardKpis | null>(null)
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [risk, setRisk] = useState<RiskBucket[]>([])
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([])
  const [network, setNetwork] = useState<{ warehouses: Warehouse[]; routes: { originLat: number; originLng: number; destLat: number; destLng: number; mode: string }[] } | null>(null)
  const [selectedRisk, setSelectedRisk] = useState<string>('')
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [worldMap, setWorldMap] = useState<object | null>(null)
  const exceptionGridRef = useRef<GridComponent>(null)
  const exceptionTooltipRef = useRef<TooltipComponent>(null)

  const formatDateParam = (date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return ''
    }
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const beforeExceptionTooltipRender = (args: TooltipEventArgs) => {
    if (!args.target.classList.contains('e-rowcell')) return

    const field = args.target.getAttribute('data-field')
    if (field !== 'type' && field !== 'warehouse') {
      args.cancel = true
      return
    }

    if (exceptionTooltipRef.current) {
      exceptionTooltipRef.current.content = args.target.textContent?.trim() ?? ''
    }
  }

  const filteredWarehouses = useMemo(() => {
    if (!filters?.warehouses) return []

    // If no region is selected (or 'All'), return all warehouses (sorted)
    if (!region) {
      return filters.warehouses.slice().sort((a, b) => a.name.localeCompare(b.name))
    }

    // Filter warehouses by the selected region and sort
    return filters.warehouses
      .filter((w) => w.region === region)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [region, filters?.warehouses])

  const query = useMemo(
    () => ({
      region: region || undefined,
      warehouse: warehouse || undefined,
      category: category || undefined,
      risk: selectedRisk || undefined,
      startDate: dateRange ? formatDateParam(dateRange[0]) : undefined,
      endDate: dateRange ? formatDateParam(dateRange[1]) : undefined,
      take: 50,
    }),
    [region, warehouse, category, selectedRisk, dateRange],
  )

  useEffect(() => {
    metaRepository.filters().then(setFilters).catch(() => undefined)
    loadWorldMap().then(setWorldMap).catch(() => setWorldMap(null))
  }, [])

  // Clear warehouse selection when region changes
  useEffect(() => {
    setWarehouse('')
  }, [region])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      dashboardRepository.getKpis(query),
      dashboardRepository.getTrend(query),
      dashboardRepository.getSupplierRisk(query),
      dashboardRepository.getExceptions(query),
      dashboardRepository.getNetwork(),
    ])
      .then(([k, t, r, e, n]) => {
        if (cancelled) return
        setKpis(k)
        setTrend(t)
        setRisk(r)
        setExceptions(e.items)
        setNetwork(n)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Failed to load dashboard')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [query])

  const markerData = useMemo(
    () =>
      (network?.warehouses ?? []).map((w) => ({
        ...w,
        latitude: w.latitude,
        longitude: w.longitude,
        name: w.name,
        utilization: w.utilization, // Keep as numeric for color mapping
        utilizationPercent: `${Math.round(w.utilization * 100)}%`,
      })),
    [network],
  )

  const navigationLines = useMemo(
    () =>
      (network?.routes ?? []).slice(0, 12).map((r) => ({
        latitude: [r.originLat, r.destLat],
        longitude: [r.originLng, r.destLng],
        color: getNavigationLineColor(r.mode, syncfusionTheme),
        width: 1.2,
        angle: 0.1,
      })),
    [network, syncfusionTheme],
  )

  // Compute theme-aware shape settings with color mapping
  const themeAwareShapeSettings = useMemo(
    () => ({
      fill: '#6BAE9E',
      border: {
        width: 0.5,
        color: isDarkTheme(syncfusionTheme) ? '#374151' : '#D0D5DD',
      },
      colorMapping: [
        { value: ['North America'], color: '#6BAE9E' },
        { value: ['South America'], color: '#5A9A8A' },
        { value: ['Africa'], color: '#4D8977' },
        { value: ['Europe'], color: '#3D7468' },
        { value: ['Asia'], color: '#235A52' },
        { value: ['Australia'], color: '#1A4A44' },
      ],
    }),
    [syncfusionTheme],
  )

  if (error) {
    return (
      <div className="agm-error">
        <p>{error}</p>
        <ButtonComponent cssClass="e-primary" onClick={() => window.location.reload()}>
          Retry
        </ButtonComponent>
      </div>
    )
  }

  const kpiCards = kpis
    ? [
        {
          key: 'inventoryValue',
          label: 'Inventory Value',
          value: formatCurrency(kpis.inventoryValue),
          delta: kpis.changes.inventoryValue,
          tip: 'Sum of on-hand inventory value across filtered warehouses.',
        },
        {
          key: 'openPurchaseOrders',
          label: 'Open Purchase Orders',
          value: formatNumber(kpis.openPurchaseOrders),
          delta: kpis.changes.openPurchaseOrders,
          tip: 'Purchase orders not yet in Received status.',
        },
        {
          key: 'supplierOtif',
          label: 'Supplier OTIF',
          value: formatPercent(kpis.supplierOtif),
          delta: kpis.changes.supplierOtif,
          tip: 'Average on-time in-full performance across suppliers.',
        },
        {
          key: 'orderFillRate',
          label: 'Order Fill Rate',
          value: formatPercent(kpis.orderFillRate),
          delta: kpis.changes.orderFillRate,
          tip: 'Average fulfillment percentage across sales orders.',
        },
        {
          key: 'inventoryTurnover',
          label: 'Inventory Turnover',
          value: formatNumber(kpis.inventoryTurnover, 1),
          delta: kpis.changes.inventoryTurnover,
          tip: 'Annualized turns based on COGS / average inventory.',
        },
        {
          key: 'ordersAtRisk',
          label: 'Orders at Risk',
          value: formatNumber(kpis.ordersAtRisk),
          delta: kpis.changes.ordersAtRisk,
          tip: 'Sales orders currently flagged High risk.',
          clickable: true,
        },
      ]
    : []

  return (
    <div>
      <div className="agm-page-header">
        <div>
          <h1>Executive Command Center</h1>
          <p>Live supply-chain position across inventory, procurement, suppliers, fulfillment, and logistics exceptions.</p>
        </div>
      </div>

      <div className="agm-filters">
        <div className="agm-filter-field">
          <label>Date range</label>
          <DateRangePickerComponent
            placeholder="Select range"
            width={240}
            max={new Date()}
            change={(e) => {
              const newValue = e.value as [Date, Date] | null
              if (newValue && newValue.length === 2 && newValue[0] && newValue[1]) {
                setDateRange(newValue)
              } else if (!newValue) {
                setDateRange(null)
              }
            }}
          />
        </div>
        <div className="agm-filter-field">
          <label>Region</label>
          <DropDownListComponent
            dataSource={['All', ...(filters?.regions ?? [])]}
            value={region || 'All'}
            change={(e) => setRegion(e.value === 'All' ? '' : String(e.value))}
            sortOrder="Ascending"
            width={160}
          />
        </div>
        <div className="agm-filter-field">
          <label>Warehouse</label>
          <DropDownListComponent
            key={warehouse}
            dataSource={[
              { id: '', name: 'All warehouses' },
              ...filteredWarehouses,
            ]}
            fields={{ text: 'name', value: 'id' }}
            value={warehouse}
            change={(e) => setWarehouse(String(e.value ?? ''))}
            sortOrder="Ascending"
            width={220}
          />
        </div>
        <div className="agm-filter-field">
          <label>Product category</label>
          <DropDownListComponent
            dataSource={['All', ...(filters?.categories ?? [])]}
            value={category || 'All'}
            change={(e) => setCategory(e.value === 'All' ? '' : String(e.value))}
            sortOrder="Ascending"
            width={180}
          />
        </div>
        <ButtonComponent
          cssClass="e-outline"
          onClick={() => {
            setRegion('')
            setWarehouse('')
            setCategory('')
            setSelectedRisk('')
            setDateRange(null)
          }}
        >
          Reset
        </ButtonComponent>
      </div>

      {loading && <div className="agm-loading">Loading command center…</div>}

      {!loading && (
        <>
          <div className="agm-kpi-grid">
            {kpiCards.map((card) => (
              <TooltipComponent key={card.key} content={card.tip} position="BottomCenter">
                <div
                  className="e-card agm-kpi"
                >
                  <div className="e-card-header">
                    <div className="e-card-header-caption">
                      <div className="e-card-title agm-kpi__label">{card.label}</div>
                    </div>
                  </div>
                  <div className="e-card-content">
                    <div className="agm-kpi__value">{card.value}</div>
                    <div className="e-card-actions agm-kpi__meta">
                      <span className={`agm-kpi__delta ${card.delta >= 0 ? 'up' : 'down'}`}>{formatDelta(card.delta)} vs prior</span>
                    </div>
                  </div>
                </div>
              </TooltipComponent>
            ))}
          </div>

          <div className="agm-grid-2">
            <div className="agm-panel">
              <h2 className="agm-panel__title">Supply chain trend</h2>
              <ChartComponent
                height="320px"
                primaryXAxis={{
                  valueType: 'Category',
                  title: 'Period',
                  interval: Math.max(1, Math.ceil(trend.length / 3) - 1),
                }}
                primaryYAxis={{ title: 'Value (USD)', labelFormat: 'C0' }}
                tooltip={{
                  enable: true,
                  shared: true,
                  nearest: true,
                  enableAnimation: false,
                  duration: 0,
                  fadeInDuration: 0,
                  fadeOutDuration: 0,
                  initialMouseMoveDelay: 0,
                }}
                tooltipRender={(args) => {
                  if (typeof args.text === 'string') {
                    args.text = args.text.replace(/\$?[\d,]+(?:\.\d+)?/g, (m: string) => {
                      const n = Number(m.replace(/[$,]/g, ''))
                      return Number.isFinite(n) ? formatCompactCurrency(n) : m
                    })
                  }
                }}
                sharedTooltipRender={(args) => {
                  // shared:true => args.text is string[] (one per series in display order)
                  if (Array.isArray(args.text)) {
                    args.text = args.text.map((line: string) =>
                      line.replace(/\$?[\d,]+(?:\.\d+)?/g, (m: string) => {
                        const n = Number(m.replace(/[$,]/g, ''))
                        return Number.isFinite(n) ? formatCompactCurrency(n) : m
                      }),
                    )
                  }
                }}
                axisLabelRender={(args) => {
                  if (args.axis.name === 'primaryXAxis') {
                    const idx = Number(args.value)
                    if (!Number.isFinite(idx)) return
                    const step = Math.max(1, Math.ceil(trend.length / 3) - 1)
                    if (idx % step !== 0) {
                      args.text = ''
                      return
                    }
                    const period = trend[idx]?.period
                    if (!period) return
                    const m = /^(\d{4})-(\d{2})$/.exec(period)
                    if (m) {
                      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                      const monthNum = parseInt(m[2], 10)
                      args.text = `${monthNames[monthNum]} ${m[1]}`
                    } else {
                      args.text = period
                    }
                  } else if (args.axis.name === 'primaryYAxis') {
                    args.text = formatCompactCurrency(Number(args.value))
                  }
                }}
                crosshair={{ enable: true, lineType: 'Vertical', snapToData: true }}
                legendSettings={{ visible: true }}
                theme={syncfusionTheme}
              >
                <Inject services={[LineSeries, Legend, Tooltip, Crosshair, Export, Category]} />
                <SeriesCollectionDirective>
                  <SeriesDirective dataSource={trend} xName="period" yName="inventoryValue" name="Inventory value" width={2} type="Line" />
                  <SeriesDirective dataSource={trend} xName="period" yName="orderDemand" name="Order demand" width={2} type="Line" />
                </SeriesCollectionDirective>
              </ChartComponent>
            </div>

            <div className="agm-panel">
              <h2 className="agm-panel__title">Supplier risk distribution</h2>
              <AccumulationChartComponent
                height="320px"
                legendSettings={{ visible: true, position: 'Bottom' }}
                tooltip={{ enable: true, format: '${point.x}: ${point.y}' }}
                theme={syncfusionTheme}
                pointClick={(e) => {
                  const point = e.point?.x as string
                  setSelectedRisk(point)
                }}
              >
                <Inject services={[PieSeries, AccumulationLegend, AccumulationTooltip, AccumulationDataLabel]} />
                <AccumulationSeriesCollectionDirective>
                  <AccumulationSeriesDirective
                    dataSource={risk}
                    xName="risk"
                    yName="count"
                    innerRadius="55%"
                    dataLabel={{ visible: true, name: 'count', position: 'Outside' }}
                  />
                </AccumulationSeriesCollectionDirective>
              </AccumulationChartComponent>
              {selectedRisk && (
                <p className="agm-muted">
                  Filtering exceptions to <strong>{selectedRisk}</strong> risk.{' '}
                  <ButtonComponent cssClass="e-flat" onClick={() => setSelectedRisk('')}>
                    Clear
                  </ButtonComponent>
                </p>
              )}
            </div>
          </div>

          <div className="agm-grid-2">
            <div className="agm-panel">
              <h2 className="agm-panel__title" style={{paddingBottom: '20px'}}>Global supply chain map</h2>
              {worldMap ? (
                <MapsComponent
                  height="360px"
                  zoomSettings={{ enable: true }}
                  theme={syncfusionTheme}
                  markerClick={(e) => {
                    const data = e.data as Warehouse
                    setSelectedWarehouse(data)
                  }}
                  className='dashboard-map'
                  legendSettings={{ visible: true, position: 'Bottom' }}
                >
                  <MapsInject services={[Marker, MapsTooltip, NavigationLine, MapsZoom, Selection]} />
                  <LayersDirective>
                    <LayerDirective
                      shapeData={worldMap}
                      shapeSettings={themeAwareShapeSettings}
                      colorValuePath="name"
                      markerSettings={[
                        {
                          visible: true,
                          dataSource: markerData.filter((m) => m.utilization < 0.5),
                          shape: 'Balloon',
                          fill: '#10B981',
                          height: 22,
                          width: 22,
                          border: {
                            width: 1.5,
                            color: '#FFFFFF',
                            opacity: 0.9,
                          },
                          animationDuration: 0,
                          tooltipSettings: {
                            visible: true,
                            valuePath: 'name',
                            format: '${name}<br/>Utilization: ${utilizationPercent}<br/>Open orders: ${openOrders}<br/>Inventory: $${inventoryValue}',
                          },
                        },
                        {
                          visible: true,
                          dataSource: markerData.filter((m) => m.utilization >= 0.5 && m.utilization < 0.8),
                          shape: 'Balloon',
                          fill: '#F59E0B',
                          height: 22,
                          width: 22,
                          border: {
                            width: 1.5,
                            color: '#FFFFFF',
                            opacity: 0.9,
                          },
                          animationDuration: 0,
                          tooltipSettings: {
                            visible: true,
                            valuePath: 'name',
                            format: '${name}<br/>Utilization: ${utilizationPercent}<br/>Open orders: ${openOrders}<br/>Inventory: $${inventoryValue}',
                          },
                        },
                        {
                          visible: true,
                          dataSource: markerData.filter((m) => m.utilization >= 0.8),
                          shape: 'Balloon',
                          fill: '#EF4444',
                          height: 22,
                          width: 22,
                          border: {
                            width: 1.5,
                            color: '#FFFFFF',
                            opacity: 0.9,
                          },
                          animationDuration: 0,
                          tooltipSettings: {
                            visible: true,
                            valuePath: 'name',
                            format: '${name}<br/>Utilization: ${utilizationPercent}<br/>Open orders: ${openOrders}<br/>Inventory: $${inventoryValue}',
                          },
                        },
                      ]}
                      navigationLineSettings={navigationLines}
                    />
                  </LayersDirective>
                </MapsComponent>
              ) : (
                <div className="agm-loading">Loading map…</div>
              )}
              {selectedWarehouse && (
                <div style={{ marginTop: '0.75rem' }}>
                  <strong>{selectedWarehouse.name}</strong>
                  <p className="agm-muted">
                    Utilization: {formatPercent(selectedWarehouse.utilization)} · Open orders: {selectedWarehouse.openOrders} ·
                    Inbound: {selectedWarehouse.inboundShipments} · Outbound: {selectedWarehouse.outboundShipments} · Inventory:{' '}
                    {formatCurrency(selectedWarehouse.inventoryValue)}
                  </p>
                  <ButtonComponent
                    cssClass="e-link"
                    onClick={() => navigate(`/warehouses/${selectedWarehouse.id}`)}
                  >
                    Open warehouse →
                  </ButtonComponent>
                </div>
              )}
            </div>

            <div className="agm-panel">
              <h2 className="agm-panel__title">Operational exceptions</h2>
              <p className="agm-muted" style={{ marginTop: 0 }}>
                Click a row to drill into the related module (inventory, procurement, orders, or warehouses).
              </p>
              <TooltipComponent ref={exceptionTooltipRef} target=".e-rowcell" beforeRender={beforeExceptionTooltipRender}>
                <GridComponent
                  ref={exceptionGridRef}
                  id="Grid"
                  dataSource={exceptions}
                  allowSorting
                  allowFiltering
                  allowPaging
                  allowExcelExport
                  allowPdfExport
                  allowReordering
                  allowResizing
                  showColumnChooser
                  enableHover
                  height={320}
                  pageSettings={{ pageSize: 8 }}
                  filterSettings={{ type: 'Menu' }}
                  toolbar={['Search', 'ColumnChooser', 'ExcelExport', 'PdfExport']}
                  toolbarClick={(args) => {
                    if (args.item.id === 'Grid_excelexport') {
                      exceptionGridRef.current?.excelExport()
                    } else if (args.item.id === 'Grid_pdfexport') {
                      exceptionGridRef.current?.pdfExport()
                    }
                  }}
                  frozenColumns={1}
                  contextMenuItems={['AutoFit', 'AutoFitAll', 'SortAscending', 'SortDescending']}
                  recordClick={(e) => {
                    const row = e.rowData as ExceptionItem | undefined
                    if (!row) return
                    const type = row.type.toLowerCase()
                    if (type.includes('inventory') || type.includes('safety')) {
                      navigate('/inventory?status=Below%20Safety')
                    } else if (type.includes('purchase') || type.includes('late purchase')) {
                      navigate(`/procurement?search=${encodeURIComponent(row.entity)}`)
                    } else if (type.includes('supplier')) {
                      navigate('/suppliers?risk=High')
                    } else if (type.includes('shipment') || type.includes('order')) {
                      navigate('/orders?risk=High')
                    } else if (type.includes('production')) {
                      navigate('/capacity')
                    } else if (row.warehouse) {
                      navigate(`/warehouses?search=${encodeURIComponent(row.warehouse)}`)
                    }
                  }}
                  queryCellInfo={(args) => {
                    if (args.cell && args.column?.field) {
                      args.cell.setAttribute('data-field', String(args.column.field))
                    }
                  }}
                >
                  <GridInject
                    services={[Filter, Sort, Toolbar, ExcelExport, PdfExport, ColumnChooser, Reorder, Resize, Freeze, ContextMenu, Search, Page]}
                  />
                  <ColumnsDirective>
                    <ColumnDirective field="type" headerText="Exception" width={170} />
                    <ColumnDirective
                      field="severity"
                      headerText="Severity"
                      width={110}
                      template={(props: { severity?: string }) => {
                        const severity = String(props.severity ?? '')
                        return <span className={`agm-status ${severityClass(severity)}`}>{severity}</span>
                      }}
                    />
                    <ColumnDirective field="entity" headerText="Entity" width={130} />
                    <ColumnDirective field="warehouse" headerText="Warehouse" width={160} />
                    <ColumnDirective field="region" headerText="Region" width={120} />
                    <ColumnDirective field="status" headerText="Status" width={100} />
                    <ColumnDirective field="detectedAt" headerText="Detected" width={160} type="dateTime" format="MM/dd/yyyy HH:mm" />
                  </ColumnsDirective>
                </GridComponent>
              </TooltipComponent>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
