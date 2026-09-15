import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { TabComponent, TabItemDirective, TabItemsDirective } from '@syncfusion/ej2-react-navigations'
import { StepperComponent, StepsDirective, StepDirective } from '@syncfusion/ej2-react-navigations/stepper'
import {
  TimelineComponent,
  ItemsDirective as TimelineItemsDirective,
  ItemDirective as TimelineItemDirective,
} from '@syncfusion/ej2-react-layouts/timeline'
import {
  MapsComponent,
  LayersDirective,
  LayerDirective,
  Inject as MapsInject,
  Marker,
  MapsTooltip,
  NavigationLine,
  Zoom as MapsZoom,
} from '@syncfusion/ej2-react-maps'
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Page,
} from '@syncfusion/ej2-react-grids'
import { DetailBreadcrumb } from '../../shared/components/DetailBreadcrumb'
import { orderRepository } from '../../shared/services/repositories'
import type { SalesOrder } from '../../shared/models/types'
import { formatCurrency, formatPercent } from '../../shared/utils/format'
import { usePageShowcase } from '../../shared/showcase/usePageShowcase'
import { useSettings } from '../../app/providers/SettingsProvider'
import { loadWorldMap } from '../../shared/services/worldMap'

const workflow = ['Received', 'Allocation', 'Picking', 'Packing', 'Shipped', 'Delivered']

const showcase = [
  { name: 'Stepper', features: ['Order fulfillment workflow'] },
  { name: 'Maps', features: ['Origin / current / destination', 'Navigation lines', 'Tooltips'] },
  { name: 'Timeline', features: ['Shipment event history'] },
  { name: 'Tabs + Grid', features: ['Order summary, items, shipment, activity'] },
]

interface ShipmentInfo {
  id: string
  originLat: number
  originLng: number
  currentLat: number
  currentLng: number
  destLat: number
  destLng: number
  destination: string
  status: string
  mode: string
}

export function OrderDetailPage() {
  const { syncfusionTheme } = useSettings()
  usePageShowcase(showcase)
  const { orderId } = useParams()
  const [order, setOrder] = useState<SalesOrder | null>(null)
  const [shipment, setShipment] = useState<ShipmentInfo | null>(null)
  const [items, setItems] = useState<{ line: number; sku: string; name: string; qty: number; unitCost: number }[]>([])
  const [timeline, setTimeline] = useState<{ date: string; eventName: string }[]>([])
  const [worldMap, setWorldMap] = useState<object | null>(null)

  useEffect(() => {
    if (!orderId) return
    orderRepository.getById(orderId).then((res) => {
      setOrder(res.order as SalesOrder)
      setShipment(res.shipment as ShipmentInfo | null)
      setItems(res.items as typeof items)
      setTimeline(res.timeline as typeof timeline)
    })
    loadWorldMap().then(setWorldMap).catch(() => undefined)
  }, [orderId])

  if (!order) return <div className="agm-loading">Loading order…</div>

  const activeStep = Math.max(0, workflow.findIndex((s) => s === order.status))
  const markers = shipment
    ? [
        { latitude: shipment.originLat, longitude: shipment.originLng, name: order.warehouseName, kind: 'Origin' },
        { latitude: shipment.currentLat, longitude: shipment.currentLng, name: 'Current location', kind: 'Current' },
        { latitude: shipment.destLat, longitude: shipment.destLng, name: shipment.destination, kind: 'Destination' },
      ]
    : []

  const lines = shipment
    ? [
        {
          latitude: [shipment.originLat, shipment.currentLat, shipment.destLat],
          longitude: [shipment.originLng, shipment.currentLng, shipment.destLng],
          color: '#7E56D8',
          width: 2,
          angle: 0.15,
        },
      ]
    : []

  return (
    <div>
      <div className="agm-detail-header">
        <DetailBreadcrumb
          items={[
            { text: 'Orders', url: '/orders' },
            { text: order.number },
          ]}
        />
        <h1 style={{ margin: 0, fontFamily: 'var(--agm-display)', fontSize: '1.5rem' }}>{order.number}</h1>
        <p className="agm-muted" style={{ margin: 0 }}>
          {order.customerName} · {formatCurrency(order.value)} · Fulfillment {formatPercent(order.fulfillmentPct)} · Risk{' '}
          <span className={`agm-status ${order.risk === 'High' ? 'critical' : 'healthy'}`}>{order.risk}</span>
        </p>
      </div>

      <div className="agm-panel">
        <h2 className="agm-panel__title">Fulfillment workflow</h2>
        <StepperComponent activeStep={activeStep}>
          <StepsDirective>
            {workflow.map((step) => (
              <StepDirective key={step} text={step} />
            ))}
          </StepsDirective>
        </StepperComponent>
      </div>

      <div className="agm-panel">
        <TabComponent heightAdjustMode="Content">
          <TabItemsDirective>
            <TabItemDirective
              header={{ text: 'Order Summary' }}
              content={() => (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '0.75rem', padding: '0.5rem 0' }}>
                  {[
                    ['Customer', order.customerName],
                    ['Region', order.region],
                    ['Warehouse', order.warehouseName],
                    ['Order date', order.orderDate],
                    ['Requested', order.requestedDate],
                    ['Priority', order.priority],
                    ['Status', order.status],
                    ['Shipment', order.shipmentId],
                    ['Value', formatCurrency(order.value)],
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
              header={{ text: 'Items' }}
              content={() => (
                <GridComponent dataSource={items} allowPaging height={260} pageSettings={{ pageSize: 6 }}>
                  <Inject services={[Page]} />
                  <ColumnsDirective>
                    <ColumnDirective field="line" headerText="#" width={60} />
                    <ColumnDirective field="sku" headerText="SKU" width={120} />
                    <ColumnDirective field="name" headerText="Product" width={220} />
                    <ColumnDirective field="qty" headerText="Qty" width={80} type="number" format="N0" textAlign="Right" />
                    <ColumnDirective field="unitCost" headerText="Unit cost" width={110} type="number" format="C2" textAlign="Right" />
                  </ColumnsDirective>
                </GridComponent>
              )}
            />
            <TabItemDirective
              header={{ text: 'Shipment' }}
              content={() => (
                <div className="agm-grid-2">
                  <div>
                    <h3 className="agm-panel__title">Tracking map</h3>
                    {worldMap && shipment ? (
                      <MapsComponent height="320px" zoomSettings={{ enable: true }} theme={syncfusionTheme}>
                        <MapsInject services={[Marker, MapsTooltip, NavigationLine, MapsZoom]} />
                        <LayersDirective>
                          <LayerDirective
                            shapeData={worldMap}
                            shapeSettings={{ fill: '#EAECF0', border: { width: 0.4, color: '#D0D5DD' } }}
                            markerSettings={[
                              {
                                visible: true,
                                dataSource: markers,
                                shape: 'Circle',
                                fill: '#9D76ED',
                                height: 12,
                                width: 12,
                                tooltipSettings: { visible: true, valuePath: 'name', format: '${kind}: ${name}' },
                              },
                            ]}
                            navigationLineSettings={lines}
                          />
                        </LayersDirective>
                      </MapsComponent>
                    ) : (
                      <div className="agm-loading">Loading shipment map…</div>
                    )}
                    {shipment && (
                      <p className="agm-muted">
                        Mode: {shipment.mode} · Status: {shipment.status} · Destination: {shipment.destination}
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="agm-panel__title">Shipment timeline</h3>
                    <TimelineComponent>
                      <TimelineItemsDirective>
                        {timeline.map((t) => (
                          <TimelineItemDirective key={`${t.date}-${t.eventName}`} content={`${t.date} — ${t.eventName}`} />
                        ))}
                      </TimelineItemsDirective>
                    </TimelineComponent>
                  </div>
                </div>
              )}
            />
            <TabItemDirective
              header={{ text: 'Activity' }}
              content={() => (
                <ul className="agm-muted">
                  <li>Order received from {order.customerName}</li>
                  <li>Inventory allocated at {order.warehouseName}</li>
                  <li>Wave released for picking</li>
                  <li>Carrier assigned ({shipment?.mode ?? 'Road'})</li>
                </ul>
              )}
            />
          </TabItemsDirective>
        </TabComponent>
      </div>
    </div>
  )
}
