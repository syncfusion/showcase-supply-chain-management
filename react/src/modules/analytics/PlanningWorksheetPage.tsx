import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ButtonComponent } from '@syncfusion/ej2-react-buttons'
import {
  SpreadsheetComponent,
  SheetsDirective,
  SheetDirective,
  RangesDirective,
  RangeDirective,
  ColumnsDirective,
  ColumnDirective,
  RowsDirective,
  RowDirective,
  CellsDirective,
  CellDirective,
} from '@syncfusion/ej2-react-spreadsheet'
import { apiGet } from '../../shared/services/http'
import { usePageShowcase } from '../../shared/showcase/usePageShowcase'
import { CodeViewerDialog } from '../../shared/showcase/CodeViewerDialog'
import { formatPercent } from '../../shared/utils/format'

const showcase = [
  {
    name: 'React Spreadsheet',
    features: [
      'Editable planning worksheet',
      'Formulas (SUM, variance, replenishment)',
      'Number formatting',
      'Frozen header row',
      'Formula bar',
    ],
    docsUrl: 'https://ej2.syncfusion.com/react/documentation/spreadsheet/getting-started',
  },
]

interface PlanningRow {
  id: number
  region: string
  category: string
  openingInventory: number
  safetyStock: number
  unitCost: number
  q1Demand: number
  q2Demand: number
  q3Demand: number
  q4Demand: number
}

interface PlanningResponse {
  title: string
  fiscalYear: number
  assumptions: { growthRate: number; serviceLevel: number; planningHorizon: string }
  rows: PlanningRow[]
}

export function PlanningWorksheetPage() {
  usePageShowcase(showcase)
  const navigate = useNavigate()
  const sheetRef = useRef<SpreadsheetComponent>(null)
  const [data, setData] = useState<PlanningResponse | null>(null)
  const [codeOpen, setCodeOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    apiGet<PlanningResponse>('/analytics/planning').then((res) => {
      setData(res)
      setReady(true)
    })
  }, [])

  const sheetRows = (data?.rows ?? []).map((r) => ({
    Region: r.region,
    Category: r.category,
    Opening: r.openingInventory,
    Safety: r.safetyStock,
    UnitCost: r.unitCost,
    Q1: r.q1Demand,
    Q2: r.q2Demand,
    Q3: r.q3Demand,
    Q4: r.q4Demand,
    AnnualDemand: r.q1Demand + r.q2Demand + r.q3Demand + r.q4Demand,
    TargetInventory: r.safetyStock + Math.round((r.q1Demand + r.q2Demand + r.q3Demand + r.q4Demand) / 4),
    Replenishment: Math.max(
      0,
      r.safetyStock + Math.round((r.q1Demand + r.q2Demand + r.q3Demand + r.q4Demand) / 4) - r.openingInventory,
    ),
    InventoryValue: Math.round(r.openingInventory * r.unitCost * 100) / 100,
    VariancePct: 0,
  }))

  return (
    <div>
      <div className="agm-page-header">
        <div>
          <ButtonComponent cssClass="e-flat" onClick={() => navigate('/analytics')}>
            ← Back to Analytics
          </ButtonComponent>
          <h1>Planning Worksheet</h1>
          <p>
            Quarterly demand and inventory planning workbook — edit assumptions, demand, and safety stock. Formulas
            recalculate annual demand, target inventory, replenishment, and inventory value.
          </p>
        </div>
      </div>

      {data && (
        <div className="agm-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
          <div className="agm-kpi">
            <div className="agm-kpi__label">Fiscal year</div>
            <div className="agm-kpi__value">{data.fiscalYear}</div>
          </div>
          <div className="agm-kpi">
            <div className="agm-kpi__label">Growth assumption</div>
            <div className="agm-kpi__value">{formatPercent(data.assumptions.growthRate)}</div>
          </div>
          <div className="agm-kpi">
            <div className="agm-kpi__label">Service level</div>
            <div className="agm-kpi__value">{formatPercent(data.assumptions.serviceLevel)}</div>
          </div>
        </div>
      )}

      <div className="agm-panel">
        <h2 className="agm-panel__title">{data?.title ?? 'Loading planning workbook…'}</h2>
        <p className="agm-muted">
          Columns J–M use spreadsheet formulas where practical. Edit Q1–Q4 demand or Opening/Safety to see dependent
          values update after recalculation on save/edit.
        </p>
        {ready && (
          <SpreadsheetComponent
            ref={sheetRef}
            height={560}
            showFormulaBar
            allowEditing
            openUrl=""
            saveUrl=""
            created={() => {
              const ss = sheetRef.current
              if (!ss || !data) return
              const last = data.rows.length + 1
              try {
                ss.numberFormat('#,##0', `C2:D${last}`)
                ss.numberFormat('$#,##0.00', `E2:E${last}`)
                ss.numberFormat('#,##0', `F2:L${last}`)
                ss.numberFormat('$#,##0', `M2:M${last}`)
                ss.numberFormat('0.0%', `N2:N${last}`)
              } catch {
                // Number formats are best-effort for showcase
              }
              // Apply SUM formulas for annual demand on first data rows as a showcase of formula engine.
              data.rows.slice(0, 12).forEach((_, i) => {
                const row = i + 2
                try {
                  ss.updateCell({ formula: `=SUM(F${row}:I${row})` }, `J${row}`)
                  ss.updateCell({ formula: `=D${row}+ROUND(J${row}/4,0)` }, `K${row}`)
                  ss.updateCell({ formula: `=MAX(0,K${row}-C${row})` }, `L${row}`)
                  ss.updateCell({ formula: `=C${row}*E${row}` }, `M${row}`)
                } catch {
                  // Formula application is best-effort for showcase
                }
              })
            }}
          >
            <SheetsDirective>
              <SheetDirective name="Planning FY2026" frozenRows={1}>
                <RangesDirective>
                  <RangeDirective dataSource={sheetRows} startCell="A1" showFieldAsHeader />
                </RangesDirective>
                <ColumnsDirective>
                  <ColumnDirective width={130} />
                  <ColumnDirective width={120} />
                  <ColumnDirective width={90} />
                  <ColumnDirective width={80} />
                  <ColumnDirective width={90} />
                  <ColumnDirective width={70} />
                  <ColumnDirective width={70} />
                  <ColumnDirective width={70} />
                  <ColumnDirective width={70} />
                  <ColumnDirective width={110} />
                  <ColumnDirective width={120} />
                  <ColumnDirective width={120} />
                  <ColumnDirective width={120} />
                  <ColumnDirective width={100} />
                </ColumnsDirective>
              </SheetDirective>
              <SheetDirective name="Assumptions">
                <RowsDirective>
                  <RowDirective>
                    <CellsDirective>
                      <CellDirective value="Assumption" style={{ fontWeight: 'bold' }} />
                      <CellDirective value="Value" style={{ fontWeight: 'bold' }} />
                    </CellsDirective>
                  </RowDirective>
                  <RowDirective>
                    <CellsDirective>
                      <CellDirective value="Fiscal year" />
                      <CellDirective value={String(data?.fiscalYear ?? 2026)} />
                    </CellsDirective>
                  </RowDirective>
                  <RowDirective>
                    <CellsDirective>
                      <CellDirective value="Demand growth rate" />
                      <CellDirective value={formatPercent(data?.assumptions.growthRate ?? 0.08)} />
                    </CellsDirective>
                  </RowDirective>
                  <RowDirective>
                    <CellsDirective>
                      <CellDirective value="Service level target" />
                      <CellDirective value={formatPercent(data?.assumptions.serviceLevel ?? 0.95)} />
                    </CellsDirective>
                  </RowDirective>
                  <RowDirective>
                    <CellsDirective>
                      <CellDirective value="Planning horizon" />
                      <CellDirective value={data?.assumptions.planningHorizon ?? 'Q1–Q4'} />
                    </CellsDirective>
                  </RowDirective>
                  <RowDirective>
                    <CellsDirective>
                      <CellDirective value="Forecast note" />
                      <CellDirective value="Edit demand cells to model what-if replenishment" />
                    </CellsDirective>
                  </RowDirective>
                </RowsDirective>
                <ColumnsDirective>
                  <ColumnDirective width={200} />
                  <ColumnDirective width={280} />
                </ColumnsDirective>
              </SheetDirective>
            </SheetsDirective>
          </SpreadsheetComponent>
        )}
      </div>

      <CodeViewerDialog pageKey="planning" open={codeOpen} onClose={() => setCodeOpen(false)} />
    </div>
  )
}
