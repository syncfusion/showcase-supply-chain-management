import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
  Search,
  Page,
  Reorder,
  Resize,
} from '@syncfusion/ej2-react-grids'
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject as ChartInject,
  LineSeries,
  Category,
  Legend,
  Tooltip,
} from '@syncfusion/ej2-react-charts'
import { ProgressBarComponent } from '@syncfusion/ej2-react-progressbar'
import {
  MapsComponent,
  LayersDirective,
  LayerDirective,
  Inject as MapsInject,
  Marker,
  MapsTooltip,
  Zoom as MapsZoom,
} from '@syncfusion/ej2-react-maps'
import { TabComponent, TabItemDirective, TabItemsDirective } from '@syncfusion/ej2-react-navigations'
import { DetailBreadcrumb } from '../../shared/components/DetailBreadcrumb'
import { createRemoteDataManager } from '../../shared/services/dataManager'
import { supplierRepository } from '../../shared/services/repositories'
import type { Supplier } from '../../shared/models/types'
import { formatCurrency, formatGridCurrency, formatNumber, formatPercent } from '../../shared/utils/format'
import { usePageShowcase } from '../../shared/showcase/usePageShowcase'
import { SavedViewsToolbar } from '../../shared/components/SavedViewsToolbar'
import { CodeViewerDialog } from '../../shared/showcase/CodeViewerDialog'
import type { SavedView } from '../../shared/services/savedViews'
import { useSettings } from '../../app/providers/SettingsProvider'
import { loadWorldMap } from '../../shared/services/worldMap'

const showcase = [
  {
    name: 'React Data Grid',
    features: ['DataManager + UrlAdaptor', 'Advanced filter', 'Grouping', 'Aggregates', 'Export', 'Saved views'],
  },
  { name: 'Charts + ProgressBar + Maps', features: ['Supplier 360 scorecard', 'Location map', 'Performance trends'] },
]

function buildUrl() {
  return `${import.meta.env.VITE_API_BASE_URL}/api/datamanager/suppliers`
}

export function SuppliersPage() {
  usePageShowcase(showcase)
  const navigate = useNavigate()
  const [codeOpen, setCodeOpen] = useState(false)
  const gridRef = useRef<GridComponent>(null)
  const remote = useMemo(() => createRemoteDataManager(buildUrl()), [])
  const currentViewState: SavedView['state'] = {}

  return (
    <div>
      <div className="agm-page-header">
        <div>
          <h1>Supplier Management</h1>
          <p>Supplier performance, contact details, compliance status, and sourcing relationships across the network.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <SavedViewsToolbar
            module="suppliers"
            currentState={currentViewState}
            gridRef={gridRef}
            onApply={() => undefined}
            onReset={() => undefined}
          />
          
        </div>
      </div>

      <div className="agm-panel">
        <GridComponent
          ref={gridRef}
          id='Grid'
          dataSource={remote.manager}
          query={remote.query}
          allowPaging
          allowSorting
          allowFiltering
          allowGrouping
          allowExcelExport
          allowPdfExport
          showColumnChooser
          height={420}
          pageSettings={{ pageSize: 12 }}
          toolbar={['Search', 'ColumnChooser', 'ExcelExport', 'PdfExport']}
          toolbarClick={(args) => {
            if (args.item.id === 'Grid_excelexport' && gridRef.current) {
              gridRef.current.excelExport()
            } else if (args.item.id === 'Grid_pdfexport' && gridRef.current) {
              gridRef.current.pdfExport()
            }
          }}
          recordClick={(e) => {
            const row = e.rowData as Supplier | undefined
            if (row?.id) navigate(`/suppliers/${row.id}`)
          }}
          queryCellInfo={(args) => {
            if (args.column?.field === 'annualSpend' && args.cell) {
              args.cell.innerText = formatGridCurrency(Number(args.data.annualSpend))
            }
            if (args.column?.field === 'risk' && args.cell) {
              const riskValue = String(args.data.risk)
              const cls = riskValue === 'Critical' ? 'critical' : riskValue === 'High' || riskValue === 'Moderate' ? 'warning' : 'healthy'
              args.cell.innerHTML = `<span class="agm-status ${cls}">${riskValue}</span>`
            }
          }}
        >
          <Inject
            services={[Filter, Sort, Toolbar, ExcelExport, PdfExport, ColumnChooser, Aggregate, Group, Search, Page, Reorder, Resize]}
          />
          <ColumnsDirective>
            <ColumnDirective field="name" headerText="Supplier" width={200} />
            <ColumnDirective field="region" headerText="Region" width={130} />
            <ColumnDirective field="category" headerText="Category" width={120} />
            <ColumnDirective field="annualSpend" headerText="Annual spend" width={140} type="number" format="C0" textAlign="Right" />
            <ColumnDirective field="leadTimeDays" headerText="Lead time" width={100} type="number" format="N0" textAlign="Right" />
            <ColumnDirective field="otif" headerText="OTIF" width={90} type="number" format="P1" textAlign="Right" />
            <ColumnDirective field="qualityScore" headerText="Quality" width={90} type="number" format="P1" textAlign="Right" />
            <ColumnDirective field="risk" headerText="Risk" width={110} />
            <ColumnDirective field="openPos" headerText="Open POs" width={100} type="number" format="N0" textAlign="Right" />
            <ColumnDirective field="status" headerText="Status" width={100} />
          </ColumnsDirective>
          <AggregatesDirective>
            <AggregateDirective>
              <AggregateColumnsDirective>
                <AggregateColumnDirective field="annualSpend" type="Sum" format="C0" footerTemplate="${Sum}" />
              </AggregateColumnsDirective>
            </AggregateDirective>
          </AggregatesDirective>
        </GridComponent>
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
          Click a supplier to open the 360 view (scorecard, trends, locations, POs).
        </p>
      </div>

      <CodeViewerDialog pageKey="suppliers" open={codeOpen} onClose={() => setCodeOpen(false)} />
    </div>
  )
}

export function SupplierDetailPage() {
  const { syncfusionTheme } = useSettings()
  const showcase = useMemo(
    () => [
      { name: 'Charts + ProgressBar', features: ['Scorecard breakdown', 'OTIF / quality trends'] },
      { name: 'Maps', features: ['Supplier location marker', 'Tooltip'] },
      { name: 'Grid', features: ['Related purchase orders'] },
    ],
    [],
  )
  usePageShowcase(showcase)
  const { supplierId } = useParams()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [detail, setDetail] = useState<{
    score: number
    scoreBreakdown: { delivery: number; quality: number; cost: number; responsiveness: number }
    trend: { month: number; otif: number; quality: number }[]
    purchaseOrders: { number: string; value: number; status: string; requiredDate: string; risk: string }[]
  } | null>(null)
  const [worldMap, setWorldMap] = useState<object | null>(null)

  useEffect(() => {
    if (!supplierId) return
    supplierRepository.getById(supplierId).then((res) => {
      setSupplier(res.supplier as Supplier)
      setDetail({
        score: res.score as number,
        scoreBreakdown: res.scoreBreakdown as {
          delivery: number
          quality: number
          cost: number
          responsiveness: number
        },
        trend: res.trend as { month: number; otif: number; quality: number }[],
        purchaseOrders: (res.purchaseOrders as { number: string; value: number; status: string; requiredDate: string; risk: string }[]) ?? [],
      })
    })
    loadWorldMap().then(setWorldMap).catch(() => undefined)
  }, [supplierId])

  if (!supplier || !detail) return <div className="agm-loading">Loading supplier 360…</div>

  return (
    <div>
      <div className="agm-detail-header">
        <DetailBreadcrumb
          items={[
            { text: 'Suppliers', url: '/suppliers' },
            { text: supplier.name },
          ]}
        />
        <h1 style={{ margin: 0, fontFamily: 'var(--agm-display)', fontSize: '1.5rem' }}>{supplier.name}</h1>
        <p className="agm-muted" style={{ margin: 0 }}>
          {supplier.status} · {supplier.country} · {supplier.category} ·{' '}
          <span className={`agm-status ${supplier.risk === 'Critical' || supplier.risk === 'High' ? 'critical' : 'healthy'}`}>
            {supplier.risk} risk
          </span>
        </p>
      </div>

      <div className="agm-panel">
        <TabComponent heightAdjustMode="Content">
          <TabItemsDirective>
            <TabItemDirective
              header={{ text: 'Overview' }}
              content={() => (
                <div className="agm-grid-2">
                  <div>
                    <h3 className="agm-panel__title" style={{ fontFamily: 'var(--agm-display)', color: 'var(--agm-ink)' }}>
                      Supplier health · Score {formatNumber(detail.score, 1)}
                    </h3>
                    <p className="agm-muted">Delivery × 35% + Quality × 30% + Cost × 20% + Responsiveness × 15%</p>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {[
                        ['Delivery (OTIF)', detail.scoreBreakdown.delivery * 100],
                        ['Quality', detail.scoreBreakdown.quality * 100],
                        ['Cost', detail.scoreBreakdown.cost * 100],
                        ['Responsiveness', detail.scoreBreakdown.responsiveness * 100],
                      ].map(([label, value]) => (
                        <div key={String(label)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{label}</span>
                            <span>{formatPercent(Number(value) / 100)}</span>
                          </div>
                          <ProgressBarComponent type="Linear" height="20px" value={Number(value)} showProgressValue={false} />
                        </div>
                      ))}
                    </div>
                    <p style={{ marginTop: '1rem' }}>
                      Annual spend {formatCurrency(supplier.annualSpend)} · {supplier.openPos} open POs · Lead time{' '}
                      {supplier.leadTimeDays} days
                    </p>
                  </div>
                  <div>
                    <h3 className="agm-panel__title" style={{ fontFamily: 'var(--agm-display)', color: 'var(--agm-ink)' }}>
                      Performance trends
                    </h3>
                    <ChartComponent
                      height="280px"
                      primaryXAxis={{ valueType: 'Category' }}
                      primaryYAxis={{ labelFormat: 'P0', minimum: 0, maximum: 1 }}
                      tooltip={{ enable: true, format: '${series.name}: ${point.y}' }}
                      legendSettings={{ visible: true }}
                      theme={syncfusionTheme}
                    >
                      <ChartInject services={[LineSeries, Category, Legend, Tooltip]} />
                      <SeriesCollectionDirective>
                        <SeriesDirective dataSource={detail.trend} xName="month" yName="otif" name="OTIF" type="Line" width={2} />
                        <SeriesDirective dataSource={detail.trend} xName="month" yName="quality" name="Quality" type="Line" width={2} />
                      </SeriesCollectionDirective>
                    </ChartComponent>
                  </div>
                </div>
              )}
            />
            <TabItemDirective
              header={{ text: 'Purchase Orders' }}
              content={() => (
                <GridComponent dataSource={detail.purchaseOrders} allowPaging height={320} pageSettings={{ pageSize: 8 }}>
                  <Inject services={[Page]} />
                  <ColumnsDirective>
                    <ColumnDirective field="number" headerText="PO" width={140} />
                    <ColumnDirective field="value" headerText="Value" width={130} type="number" format="C0" textAlign="Right" />
                    <ColumnDirective field="status" headerText="Status" width={130} />
                    <ColumnDirective field="requiredDate" headerText="Required date" type="date" format="MM/dd/yyyy"  width={110} />
                    <ColumnDirective field="risk" headerText="Risk" width={100} />
                  </ColumnsDirective>
                </GridComponent>
              )}
            />
            <TabItemDirective
              header={{ text: 'Locations' }}
              content={() =>
                worldMap ? (
                  <MapsComponent height="360px" zoomSettings={{ enable: true }} theme={syncfusionTheme}>
                    <MapsInject services={[Marker, MapsTooltip, MapsZoom]} />
                    <LayersDirective>
                      <LayerDirective
                        shapeData={worldMap}
                        shapeSettings={{ fill: '#EAECF0', border: { width: 0.4, color: '#D0D5DD' } }}
                        markerSettings={[
                          {
                            visible: true,
                            dataSource: [
                              {
                                latitude: supplier.latitude,
                                longitude: supplier.longitude,
                                name: supplier.name,
                                country: supplier.country,
                              },
                            ],
                            shape: 'Balloon',
                            fill: 'var(--agm-brand)',
                            height: 16,
                            width: 16,
                            tooltipSettings: {
                              visible: true,
                              valuePath: 'name',
                              format: '${name}<br/>${country}',
                            },
                          },
                        ]}
                      />
                    </LayersDirective>
                  </MapsComponent>
                ) : (
                  <div className="agm-loading">Loading map…</div>
                )
              }
            />
          </TabItemsDirective>
        </TabComponent>
      </div>
    </div>
  )
}
