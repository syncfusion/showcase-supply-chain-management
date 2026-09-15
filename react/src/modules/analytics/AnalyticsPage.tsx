import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { IDataOptions } from '@syncfusion/ej2-react-pivotview'
import {
  PivotViewComponent,
  Inject,
  FieldList,
  CalculatedField,
  ExcelExport,
  PDFExport,
  GroupingBar,
  PivotChart,
} from '@syncfusion/ej2-react-pivotview'
import { ButtonComponent } from '@syncfusion/ej2-react-buttons'
import { analyticsRepository } from '../../shared/services/repositories'
import type { PivotRow } from '../../shared/models/types'
import { usePageShowcase } from '../../shared/showcase/usePageShowcase'
import { CodeViewerDialog } from '../../shared/showcase/CodeViewerDialog'

const showcase = [
  {
    name: 'React Pivot Table',
    features: [
      'Field list',
      'Grouping bar',
      'Filtering / sorting',
      'Aggregation',
      'Calculated fields',
      'Drill-down',
      'Export',
      'Pivot Chart',
    ],
  },
  {
    name: 'React Spreadsheet',
    features: ['Planning worksheet (separate route)', 'Formulas', 'Editable assumptions'],
  },
]

type ViewMode = 'table' | 'chart' | 'both'

export function AnalyticsPage() {
  usePageShowcase(showcase)
  const navigate = useNavigate()
  const [data, setData] = useState<PivotRow[]>([])
  const [mode, setMode] = useState<ViewMode>('both')
  const [loading, setLoading] = useState(true)
  const [codeOpen, setCodeOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    analyticsRepository
      .pivot()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const dataSourceSettings: IDataOptions = {
    dataSource: data as unknown as IDataOptions['dataSource'],
    expandAll: false,
    enableSorting: true,
    columns: [{ name: 'region' }, { name: 'country' }],
    rows: [{ name: 'productCategory' }, { name: 'supplier' }],
    values: [
      { name: 'revenue', caption: 'Revenue' },
      { name: 'purchaseAmount', caption: 'Purchase amount' },
      { name: 'delayDays', caption: 'Delay days', type: 'Avg' },
    ],
    filters: [{ name: 'orderStatus' }],
    formatSettings: [
      { name: 'revenue', format: 'C0' },
      { name: 'purchaseAmount', format: 'C0' },
      { name: 'inventoryValue', format: 'C0' },
      { name: 'freightCost', format: 'C0' },
      { name: 'delayDays', format: 'N1' },
      { name: 'RevenuePerOrderQty', format: 'C2' },
    ],
    calculatedFieldSettings: [
      {
        name: 'RevenuePerOrderQty',
        formula: '"Sum(revenue)"/"Sum(orderQuantity)"',
      },
    ],
  }

  return (
    <div>
      <div className="agm-page-header">
        <div>
          <h1>Supply Chain Analytics</h1>
          <p>Explore operational data, compare supply chain performance, and turn findings into planning decisions.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['table', 'chart', 'both'] as ViewMode[]).map((m) => (
            <ButtonComponent key={m} cssClass={mode === m ? 'e-primary' : 'e-outline'} onClick={() => setMode(m)}>
              {m === 'both' ? 'Table + Chart' : m[0].toUpperCase() + m.slice(1)}
            </ButtonComponent>
          ))}
          <ButtonComponent cssClass="e-outline" onClick={() => navigate('/analytics/planning')}>
            Planning Worksheet
          </ButtonComponent>
        </div>
      </div>

      <div className="agm-panel">
        {loading ? (
          <div className="agm-loading">Loading analytical dataset…</div>
        ) : (
          <PivotViewComponent
            id="agm-pivot"
            dataSourceSettings={dataSourceSettings}
            width="100%"
            height={mode === 'both' ? 620 : 520}
            showFieldList
            showGroupingBar
            allowCalculatedField
            allowExcelExport
            allowPdfExport
            displayOption={{
              view: mode === 'table' ? 'Table' : mode === 'chart' ? 'Chart' : 'Both',
              primary: 'Table',
            }}
            chartSettings={{
              title: 'Supply chain pivot chart',
              chartSeries: { type: 'Column' },
            }}
            gridSettings={{ columnWidth: 120 }}
          >
            <Inject services={[FieldList, CalculatedField, ExcelExport, PDFExport, GroupingBar, PivotChart]} />
          </PivotViewComponent>
        )}
      </div>

      <CodeViewerDialog pageKey="analytics" open={codeOpen} onClose={() => setCodeOpen(false)} />
    </div>
  )
}
