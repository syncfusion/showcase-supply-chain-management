import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  MapsComponent,
  LayersDirective,
  LayerDirective,
  Inject as MapsInject,
  Marker,
  MapsTooltip,
} from '@syncfusion/ej2-react-maps'
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject as ChartInject,
  ColumnSeries,
  Category,
  Legend,
  Tooltip,
} from '@syncfusion/ej2-react-charts'
import {
  ScheduleComponent,
  ViewsDirective,
  ViewDirective,
  ResourcesDirective,
  ResourceDirective,
  Inject as ScheduleInject,
  TimelineViews,
  TimelineMonth,
  Resize,
  DragAndDrop,
  Day,
  Week,
  WorkWeek,
  Month,
  Agenda,
  MonthAgenda,
} from '@syncfusion/ej2-react-schedule'
import {
  TreeGridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject as TreeInject,
  Filter,
  Sort,
  Aggregate,
} from '@syncfusion/ej2-react-treegrid'
import { warehouseRepository } from '../../shared/services/repositories'
import type { DockAppointment, Warehouse, WarehouseLocationNode } from '../../shared/models/types'
import { formatCompactCurrency, formatCurrency, formatPercent } from '../../shared/utils/format'
import { usePageShowcase } from '../../shared/showcase/usePageShowcase'
import { useSettings } from '../../app/providers/SettingsProvider'
import { loadWorldMap } from '../../shared/services/worldMap'

const EVENT_TYPE_COLORS: Record<string, string> = {
  'Inbound Shipment': '#7E56D8',
  'Outbound Shipment': '#56C2D8',
  Maintenance: '#E08A1E',
  Reserved: '#5BAE74',
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  Scheduled: 'agm-event__status--scheduled',
  'In Progress': 'agm-event__status--in-progress',
  Delayed: 'agm-event__status--delayed',
  Completed: 'agm-event__status--completed',
  Cancelled: 'agm-event__status--cancelled',
}

const showcase = [
  { name: 'React Maps', features: ['Warehouse network markers', 'Tooltips', 'Zoom', 'Selection navigation'] },
  { name: 'React Scheduler', features: ['Day, Week, WorkWeek, Month, Agenda, MonthAgenda views', 'Timeline Day / Week / WorkWeek / Month', 'Resource grouping by Dock', 'Drag-and-drop', 'Resize', 'Event templates'] },
  { name: 'React TreeGrid', features: ['Warehouse → Zone → Aisle → Bin hierarchy', 'Expand/collapse', 'Sorting', 'Filtering'] },
]

// Time formatter: "9:30 AM" / "11:30 AM" — matches the Syncfusion demo's
// 12-hour clock + AM/PM rendering.
function formatTimeShort(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const h12 = hours % 12 || 12
  return `${h12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`
}

// String-trim helper — the demo's appointment cards cut off the Location
// with a single ellipsis character once it overflows.
function trimWithEllipsis(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s
}

type ScheduleEventRow = {
  Id?: string
  Subject?: string
  StartTime?: Date | string
  EndTime?: Date | string
  Location?: string
  Description?: string
  Status?: string
  DockName?: string
}

function toDate(value: Date | string | undefined): Date | undefined {
  if (!value) return undefined
  if (value instanceof Date) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

// Mirrors Syncfusion's `Default Functionalities` demo: bold subject up to ~4
// lines, time range below, dock + location sub-line at the bottom (truncated
// with the same single-character ellipsis style as the demo).
const eventTemplate = (props: ScheduleEventRow | undefined) => {
  if (!props) return null
  const start = toDate(props.StartTime)
  const end = toDate(props.EndTime)
  const startText = start ? formatTimeShort(start) : ''
  const endText = end ? formatTimeShort(end) : ''
  // The demo's `9:30 AM - ...` style collapses the end time when the card is
  // height-constrained; we replicate that by trimming the range line.
  const range = startText && endText ? `${startText} -` : startText
  const dock = props.DockName?.trim() ? `${props.DockName}: ` : ''
  const location = trimWithEllipsis(props.Location ?? '', 24)
  return (
    <div className="agm-event">
      <div className="agm-event__subject">{props.Subject ?? ''}</div>
      <div className="agm-event__time">{range}</div>
      <div className="agm-event__location">{dock}{location}</div>
    </div>
  )
}

export function WarehousesPage() {
  const { syncfusionTheme } = useSettings()
  usePageShowcase(showcase)
  const { warehouseId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedId, setSelectedId] = useState(warehouseId ?? '')
  const [detail, setDetail] = useState<{
    warehouse: Warehouse
    dockAppointments: DockAppointment[]
    locations: WarehouseLocationNode[]
    inventoryByCategory: { category: string; value: number }[]
  } | null>(null)
  const [worldMap, setWorldMap] = useState<object | null>(null)

  useEffect(() => {
    const search = params.get('search')
    warehouseRepository.list({ search: search || undefined }).then((res) => {
      setWarehouses(res.items)
      if (search) {
        const match = res.items.find(
          (w) =>
            w.name.toLowerCase().includes(search.toLowerCase()) ||
            w.code.toLowerCase().includes(search.toLowerCase()),
        )
        if (match) {
          setSelectedId(match.id)
          return
        }
      }
      if (!warehouseId && !selectedId && res.items[0]) setSelectedId(res.items[0].id)
    })
    loadWorldMap().then(setWorldMap).catch(() => undefined)
  }, [params, selectedId, warehouseId])

  useEffect(() => {
    if (warehouseId) setSelectedId(warehouseId)
  }, [warehouseId])

  useEffect(() => {
    if (!selectedId) return
    warehouseRepository.getById(selectedId).then(setDetail).catch(() => setDetail(null))
  }, [selectedId])

  const resources = useMemo(() => {
    // Always render every dock at this warehouse (Plant = 12, Hub = 10,
    // others = 6 — same ratios the seeder uses) so the Resource column
    // header is populated even for the current week. Each dock group then
    // lights up whichever days have events scheduled.
    if (!detail) return []
    const warehouseType = detail.warehouse.type
    const dockCount = warehouseType === 'Plant' ? 12 : warehouseType === 'Hub' ? 10 : 6
    const code = detail.warehouse.code
    const fromAppointments = new Map<string, string>()
    for (const a of detail.dockAppointments) fromAppointments.set(a.dockId, a.dockName)
    const list: { dockId: string; dockName: string }[] = []
    for (let dock = 1; dock <= dockCount; dock++) {
      const dockId = `${code}-DOCK-${String(dock).padStart(2, '0')}`
      list.push({ dockId, dockName: fromAppointments.get(dockId) ?? `Dock ${dock}` })
    }
    return list
  }, [detail])

  const mapMarkers = useMemo(
    () =>
      warehouses.map((warehouse) => ({
        ...warehouse,
        latitude: Number(warehouse.latitude),
        longitude: Number(warehouse.longitude),
        utilization: Number(warehouse.utilization),
      })),
    [warehouses],
  )

  // Map API dock appointments into the schema the Syncfusion Schedule renders.
  // The backend can return several entries that collide on (StartTime, DockId)
  // for the same timeslot — in that case the scheduler draws one card on top
  // of another and the inner text becomes unreadable. Collapse them here so
  // each (StartTime, DockId) cell renders at most one card, then sort
  // chronologically so the list scans left-to-right across the resource grid.
  const events = useMemo(() => {
    const seen = new Set<string>()
    const list: {
      Id: string
      Subject: string
      StartTime: Date
      EndTime: Date
      DockId: string
      DockName: string
      EventType: string
      Status: string
      Location: string
      Description: string
      IsAllDay: boolean
      CategoryColor: string
    }[] = []
    for (const d of detail?.dockAppointments ?? []) {
      const start = new Date(d.startTime)
      const end = new Date(d.endTime)
      const value = end.getTime() - start.getTime()
      const isAllDay = d.eventType === 'Maintenance' && value >= 10 * 60 * 60 * 1000
      const key = `${start.getTime()}`
      if (seen.has(key)) continue
      seen.add(key)
      list.push({
        Id: d.id,
        Subject: d.subject,
        StartTime: start,
        EndTime: end,
        DockId: d.dockId,
        DockName: d.dockName,
        EventType: d.eventType,
        Status: d.status,
        Location: d.location,
        Description: d.description,
        IsAllDay: isAllDay,
        CategoryColor: EVENT_TYPE_COLORS[d.eventType] ?? '#7E56D8',
      })
    }
    list.sort((a, b) => a.StartTime.getTime() - b.StartTime.getTime())
    return list
  }, [detail])
  return (
    <div>
      <div className="agm-page-header">
        <div>
          <h1>Warehouse Operations</h1>
          <p>Network map, dock scheduling, and bin-level inventory hierarchy for distribution centers.</p>
        </div>
      </div>

      <div className="agm-panel">
        <h2 className="agm-panel__title">Warehouse network</h2>
        {worldMap && mapMarkers.length > 0 ? (
          <MapsComponent
            key={mapMarkers.map((warehouse) => `${warehouse.id}:${warehouse.latitude}:${warehouse.longitude}:${warehouse.utilization}`).join('|')}
            height="320px"
            theme={syncfusionTheme}
            markerClick={(e) => {
              const wh = e.data as Warehouse
              setSelectedId(wh.id)
              navigate(`/warehouses/${wh.id}`)
            }}
          >
            <MapsInject services={[Marker, MapsTooltip]} />
            <LayersDirective>
              <LayerDirective
                shapeData={worldMap}
                shapeSettings={{ fill: '#EAECF0', border: { width: 0.4, color: '#D0D5DD' } }}
                markerSettings={[
                  {
                    visible: true,
                    dataSource: mapMarkers,
                    shape: 'Circle',
                    fill: '#9D76ED',
                    height: 14,
                    width: 14,
                    tooltipSettings: {
                      visible: true,
                      valuePath: 'name',
                      format: '${name}<br/>${type} · Util ${utilization}',
                    },
                    latitudeValuePath: 'latitude',
                    longitudeValuePath: 'longitude',
                  },
                ]}
              />
            </LayersDirective>
          </MapsComponent>
        ) : (
          <div className="agm-loading">Loading map…</div>
        )}
      </div>

      {detail && (
        <>
          <div className="agm-kpi-grid" style={{ gridTemplateColumns: 'repeat(6, minmax(0,1fr))' }}>
            {[
              ['Facility', detail.warehouse.name],
              ['Utilization', formatPercent(detail.warehouse.utilization)],
              ['Inventory', formatCurrency(detail.warehouse.inventoryValue)],
              ['Open orders', String(detail.warehouse.openOrders)],
              ['Inbound today', String(detail.warehouse.inboundShipments)],
              ['Outbound today', String(detail.warehouse.outboundShipments)],
            ].map(([label, value]) => (
              <div className="agm-kpi" key={label}>
                <div className="agm-kpi__label">{label}</div>
                <div className="agm-kpi__value" style={{ fontSize: label === 'Facility' ? '0.95rem' : '1.2rem' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div className="agm-grid-2">
            <div className="agm-panel">
              <h2 className="agm-panel__title">Inventory by category</h2>
              <ChartComponent
                height="320px"
                primaryXAxis={{ valueType: 'Category', labelRotation: -20 }}
                primaryYAxis={{ labelFormat: 'C0' }}
                tooltip={{ enable: true, format: '${point.x}: ${point.y}' }}
                axisLabelRender={(args) => {
                  if (args.axis.name === 'primaryYAxis') args.text = formatCompactCurrency(Number(args.value))
                }}
                theme={syncfusionTheme}
              >
                <ChartInject services={[ColumnSeries, Category, Legend, Tooltip]} />
                <SeriesCollectionDirective>
                  <SeriesDirective
                    dataSource={detail.inventoryByCategory}
                    xName="category"
                    yName="value"
                    type="Column"
                    fill="#7E56D8"
                  />
                </SeriesCollectionDirective>
              </ChartComponent>
            </div>
            <div className="agm-panel">
              <h2 className="agm-panel__title">Location hierarchy</h2>
              <TreeGridComponent
                dataSource={detail.locations}
                treeColumnIndex={0}
                idMapping="id"
                parentIdMapping="parentId"
                height={240}
                allowSorting
                allowFiltering
              >
                <TreeInject services={[Filter, Sort, Aggregate]} />
                <ColumnsDirective>
                  <ColumnDirective field="name" headerText="Location" width={160} />
                  <ColumnDirective field="level" headerText="Level" width={90} />
                  <ColumnDirective field="capacity" headerText="Capacity" width={90} type="number" format="N0" textAlign="Right" />
                  <ColumnDirective field="quantity" headerText="Qty" width={80} type="number" format="N0" textAlign="Right" />
                  <ColumnDirective field="utilization" headerText="Util" width={80} type="number" format="P0" textAlign="Right" />
                  <ColumnDirective
                    field="status"
                    headerText="Status"
                    width={110}
                    template={(props: { status?: string }) => {
                      const status = String(props.status ?? '')
                      const cls = /healthy|open|active|available/i.test(status)
                        ? 'healthy'
                        : /warning|partial|pending/i.test(status)
                          ? 'warning'
                          : 'critical'
                      return <span className={`agm-status ${cls}`}>{status}</span>
                    }}
                  />
                </ColumnsDirective>
              </TreeGridComponent>
            </div>
          </div>

          <div className="agm-panel">
            <h2 className="agm-panel__title">Dock scheduling · {detail.warehouse.name}</h2>
            <p className="agm-help-text">
              {events.length.toLocaleString()} appointments scheduled across the past and next 60 days.
              Switch between Day, Week, WorkWeek, Month, Agenda, MonthAgenda, and the Timeline
              equivalents using the view bar above the calendar.
            </p>
            <div className="agm-scheduler">
              <ScheduleComponent
                height="540px"
                width="100%"
                selectedDate={new Date()}
                currentView="Week"
                theme={syncfusionTheme}
                showHeaderBar
                showQuickInfo
                allowResizing
                allowDragAndDrop
                eventSettings={{
                  dataSource: events,
                  fields: {
                    id: 'Id',
                    subject: { name: 'Subject' },
                    startTime: { name: 'StartTime' },
                    endTime: { name: 'EndTime' },
                    description: { name: 'Description' },
                    location: { name: 'Location' },
                    isAllDay: { name: 'IsAllDay' },
                    resourceId: { name: 'DockId' },
                    categoryColor: { name: 'CategoryColor' },
                  },
                  template: eventTemplate,
                }}
                popupOpen={(args) => {
                  // Editor template gets the same rich widget treatment as the demo
                  // (more-fields / additional-fields) so editing shows the location.
                  const isEditor = args.type === 'Editor'
                  if (!isEditor) return
                  const data =
                    (args.data as Record<string, unknown> | undefined)?.['event'] as
                      | Record<string, unknown>
                      | undefined
                  if (data && !args.element.querySelector('.agm-editor-extra')) {
                    const extra = document.createElement('div')
                    extra.className = 'agm-editor-extra'
                    const location = (data['Location'] as string | undefined) ?? ''
                    const status = (data['Status'] as string | undefined) ?? ''
                    const dock = (data['DockName'] as string | undefined) ?? ''
                    const type = (data['EventType'] as string | undefined) ?? ''
                    extra.innerHTML = `
                      <div class="agm-editor-extra__row"><span class="agm-editor-extra__label">Dock</span><span>${dock}</span></div>
                      <div class="agm-editor-extra__row"><span class="agm-editor-extra__label">Type</span><span>${type}</span></div>
                      <div class="agm-editor-extra__row"><span class="agm-editor-extra__label">Location</span><span>${location}</span></div>
                      <div class="agm-editor-extra__row"><span class="agm-editor-extra__label">Status</span><span>${status}</span></div>
                    `
                    args.element.appendChild(extra)
                  }
                }}
                eventRendered={(args) => {
                  const status = String(args.data?.Status ?? '')
                  const badge = STATUS_BADGE_CLASS[status]
                  if (badge) (args.element as HTMLElement)?.classList.add(badge)
                }}
              >
                <ResourcesDirective>
                  <ResourceDirective
                    field="DockId"
                    title="Dock"
                    name="Docks"
                    allowMultiple
                    dataSource={resources}
                    textField="dockName"
                    idField="dockId"
                    colorField="dockId"
                  />
                </ResourcesDirective>
                <ViewsDirective>
                  <ViewDirective option="Day" />
                  <ViewDirective option="Week" />
                  <ViewDirective option="WorkWeek" />
                  <ViewDirective option="Month" />
                  <ViewDirective option="Agenda" />
                  <ViewDirective option="MonthAgenda" />
                  <ViewDirective option="TimelineDay" />
                  <ViewDirective option="TimelineWeek" />
                  <ViewDirective option="TimelineWorkWeek" />
                  <ViewDirective option="TimelineMonth" />
                </ViewsDirective>
                <ScheduleInject
                  services={[
                    Day,
                    Week,
                    WorkWeek,
                    Month,
                    Agenda,
                    MonthAgenda,
                    TimelineViews,
                    TimelineMonth,
                    Resize,
                    DragAndDrop,
                  ]}
                />
              </ScheduleComponent>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
