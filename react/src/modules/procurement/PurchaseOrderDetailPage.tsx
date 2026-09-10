import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ButtonComponent } from '@syncfusion/ej2-react-buttons'
import { TabComponent, TabItemDirective, TabItemsDirective } from '@syncfusion/ej2-react-navigations'
import { StepperComponent, StepsDirective, StepDirective } from '@syncfusion/ej2-react-navigations/stepper'
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Page,
  Sort,
} from '@syncfusion/ej2-react-grids'
import { ToastComponent } from '@syncfusion/ej2-react-notifications'
import { DialogComponent } from '@syncfusion/ej2-react-popups'
import { PdfViewerComponent } from '@syncfusion/ej2-react-pdfviewer'
import { DetailBreadcrumb } from '../../shared/components/DetailBreadcrumb'
import { procurementRepository } from '../../shared/services/repositories'
import type { PurchaseOrder } from '../../shared/models/types'
import { formatCurrency } from '../../shared/utils/format'
import { usePageShowcase } from '../../shared/showcase/usePageShowcase'

const workflow = ['Draft', 'Approval', 'Issued', 'Supplier Confirmed', 'In Transit', 'Received']

const showcase = [
  { name: 'Stepper', features: ['PO status workflow visualization'] },
  { name: 'Tabs', features: ['Items / Delivery / Documents / Activity'] },
  { name: 'Data Grid', features: ['PO line items'] },
  { name: 'PDF Viewer', features: ['Enterprise document viewing'] },
  { name: 'Dialog / Toast', features: ['Approve / Reject actions'] },
]

export function PurchaseOrderDetailPage() {
  usePageShowcase(showcase)
  const { poId } = useParams()
  const [po, setPo] = useState<PurchaseOrder | null>(null)
  const [lines, setLines] = useState<{ line: number; sku: string; product: string; qty: number; unitCost: number; value: number }[]>([])
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [pdfError, setPdfError] = useState(false)
  const [dialogVisible, setDialogVisible] = useState(false)
  const toastRef = useRef<ToastComponent>(null)

  useEffect(() => {
    if (!poId) return
    procurementRepository.getById(poId).then((res) => {
      setPo(res.purchaseOrder as PurchaseOrder)
      setLines(res.lines as typeof lines)
    })
  }, [poId])

  useEffect(() => {
    if (!po) return
    setPdfError(false)
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''
    fetch(`${apiBase}/api/purchase-orders/${po.id}.pdf`)
      .then((res) => {
        if (!res.ok) throw new Error('PDF request failed')
        return res.arrayBuffer()
      })
      .then((buffer) => {
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        setPdfBase64(`data:application/pdf;base64,${btoa(binary)}`)
      })
      .catch(() => {
        setPdfBase64(null)
        setPdfError(true)
      })
  }, [po])

  const activeStep = useMemo(() => {
    if (!po) return 0
    const idx = workflow.findIndex((s) => s === po.status)
    return idx >= 0 ? idx : 0
  }, [po])

  if (!po) return <div className="agm-loading">Loading purchase order…</div>

  return (
    <div>
      <div className="agm-detail-header">
        <DetailBreadcrumb
          items={[
            { text: 'Procurement', url: '/procurement' },
            { text: po.number },
          ]}
        />
        <h1 style={{ margin: 0, fontFamily: 'var(--agm-display)', fontSize: '1.5rem' }}>{po.number}</h1>
        <p className="agm-muted" style={{ margin: 0 }}>
          {po.supplierName} · {formatCurrency(po.value)} · {po.plant}
        </p>
      </div>

      <div className="agm-panel">
        <h2 className="agm-panel__title">Status workflow</h2>
        <StepperComponent activeStep={activeStep}>
          <StepsDirective>
            {workflow.map((step) => (
              <StepDirective key={step} text={step} />
            ))}
          </StepsDirective>
        </StepperComponent>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <ButtonComponent cssClass="e-primary" onClick={() => setDialogVisible(true)}>
            Review approval
          </ButtonComponent>
          <Link to={`/suppliers?search=${encodeURIComponent(po.supplierName)}`} style={{ color: 'var(--agm-brand)' }}>
            View supplier →
          </Link>
        </div>
      </div>

      <div className="agm-panel">
        <TabComponent heightAdjustMode="Content">
          <TabItemsDirective>
            <TabItemDirective
              header={{ text: 'Items' }}
              content={() => (
                <GridComponent dataSource={lines} allowPaging allowSorting height={280} pageSettings={{ pageSize: 8 }}>
                  <Inject services={[Page, Sort]} />
                  <ColumnsDirective>
                    <ColumnDirective field="line" headerText="#" width={60} />
                    <ColumnDirective field="sku" headerText="SKU" width={120} />
                    <ColumnDirective field="product" headerText="Product" width={220} clipMode="EllipsisWithTooltip" />
                    <ColumnDirective field="qty" headerText="Qty" width={80} type="number" format="N0" textAlign="Right" />
                    <ColumnDirective field="unitCost" headerText="Unit cost" width={110} type="number" format="C2" textAlign="Right" />
                    <ColumnDirective field="value" headerText="Value" width={120} type="number" format="C2" textAlign="Right" />
                  </ColumnsDirective>
                </GridComponent>
              )}
            />
            <TabItemDirective
              header={{ text: 'Delivery' }}
              content={() => (
                <div style={{ padding: '0.75rem 0' }}>
                  <p>
                    <strong>Required:</strong> {po.requiredDate}
                  </p>
                  <p>
                    <strong>Delivery status:</strong> {po.deliveryStatus}
                  </p>
                  <p>
                    <strong>Plant:</strong> {po.plant}
                  </p>
                  <p className="agm-muted">Shipment tracking map is demonstrated on the Order detail and Warehouses modules.</p>
                </div>
              )}
            />
            <TabItemDirective
              header={{ text: 'Documents' }}
              content={() => (
                <div>
                  <p className="agm-muted">Purchase Order PDF — {po.number} ({po.supplierName}).</p>
                  {pdfError ? (
                    <p className="agm-muted">Unable to load the purchase order PDF.</p>
                  ) : pdfBase64 ? (
                    <PdfViewerComponent
                      id="po-pdf"
                      height="420px"
                      documentPath={pdfBase64}
                      resourceUrl="https://cdn.syncfusion.com/ej2/34.2.5/dist/ej2-pdfviewer-lib"
                    />
                  ) : (
                    <p className="agm-muted">Loading PDF…</p>
                  )}
                </div>
              )}
            />
            <TabItemDirective
              header={{ text: 'Activity' }}
              content={() => (
                <ul className="agm-muted">
                  <li>{po.createdDate} — PO created by {po.buyer}</li>
                  <li>Submitted for procurement manager review</li>
                  <li>Finance review {po.status === 'Approval' ? 'pending' : 'completed'}</li>
                  <li>Supplier {po.supplierName} notified</li>
                </ul>
              )}
            />
          </TabItemsDirective>
        </TabComponent>
      </div>

      <DialogComponent
        header="Procurement approval"
        visible={dialogVisible}
        width="440px"
        showCloseIcon
        close={() => setDialogVisible(false)}
        buttons={[
          {
            click: async () => {
              const res = (await procurementRepository.approve(po.id, 'Approved from detail')) as { message: string }
              toastRef.current?.show({ title: 'Approved', content: res.message, cssClass: 'e-toast-success' })
              setDialogVisible(false)
            },
            buttonModel: { content: 'Approve', isPrimary: true, cssClass: 'e-success' },
          },
          {
            click: async () => {
              const res = (await procurementRepository.reject(po.id, 'Rejected from detail')) as { message: string }
              toastRef.current?.show({ title: 'Rejected', content: res.message, cssClass: 'e-toast-warning' })
              setDialogVisible(false)
            },
            buttonModel: { content: 'Reject', cssClass: 'e-danger' },
          },
        ]}
      >
        <p>
          Approve or reject <strong>{po.number}</strong> ({formatCurrency(po.value)}).
        </p>
      </DialogComponent>
      <ToastComponent ref={toastRef} position={{ X: 'Right', Y: 'Bottom' }} />
    </div>
  )
}
