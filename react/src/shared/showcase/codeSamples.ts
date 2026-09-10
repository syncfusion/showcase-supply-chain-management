export interface CodeSample {
  id: string
  title: string
  description: string
  tabs: { id: string; label: string; language: string; code: string }[]
  docsUrl?: string
}

export const codeSamples: CodeSample[] = [
  {
    id: 'inventory-datamanager',
    title: 'Inventory Grid — DataManager + UrlAdaptor',
    description: 'Remote virtualized grid bound to ASP.NET Core UrlAdaptor endpoint.',
    docsUrl: 'https://ej2.syncfusion.com/react/documentation/grid/data-binding/remote-data',
    tabs: [
      {
        id: 'react',
        label: 'React',
        language: 'tsx',
        code: `import { GridComponent, ColumnsDirective, ColumnDirective, Inject, VirtualScroll, Filter, Sort } from '@syncfusion/ej2-react-grids'
import { createRemoteDataManager } from '../../shared/services/dataManager'

const { manager, query } = createRemoteDataManager('/api/datamanager/inventory?status=Below%20Safety')

export function InventoryExplorer() {
  return (
    <GridComponent
      dataSource={manager}
      query={query}
      enableVirtualization
      height={480}
      allowSorting
      allowFiltering
      filterSettings={{ type: 'Excel' }}
      frozenColumns={2}
    >
      <Inject services={[VirtualScroll, Filter, Sort]} />
      <ColumnsDirective>
        <ColumnDirective field="sku" headerText="SKU" width={130} isFrozen />
        <ColumnDirective field="productName" headerText="Product" width={220} isFrozen />
        <ColumnDirective field="inventoryValue" headerText="Value" format="C0" />
        <ColumnDirective field="status" headerText="Status" width={130} />
      </ColumnsDirective>
    </GridComponent>
  )
}`,
      },
      {
        id: 'api',
        label: 'API',
        language: 'csharp',
        code: `[HttpPost("inventory")]
public IActionResult Inventory([FromBody] DataManagerRequest? request)
{
    request = MergeQueryFilters(request);
    return Ok(Process(store.Inventory, request, [
        "sku", "productName", "warehouseName", "status"
    ]));
}

// Response shape expected by Syncfusion UrlAdaptor:
// { "result": [ ... ], "count": 75000 }`,
      },
      {
        id: 'config',
        label: 'Configuration',
        language: 'ts',
        code: `export function createRemoteDataManager(url: string) {
  const manager = new DataManager({
    url,
    adaptor: new AgmUrlAdaptor(), // injects X-Network-Simulation header
  })
  return { manager, query: new Query() }
}`,
      },
    ],
  },
  {
    id: 'inventory-batch-edit',
    title: 'Inventory Adjustment — Batch Editing',
    description: 'Separate workspace from virtualization; batch edit with calculated inventory value.',
    tabs: [
      {
        id: 'react',
        label: 'React',
        language: 'tsx',
        code: `<GridComponent
  dataSource={adjustmentRows}
  editSettings={{ allowEditing: true, allowAdding: true, allowDeleting: true, mode: 'Batch' }}
  toolbar={['Add', 'Delete', 'Update', 'Cancel']}
  cellSave={(args) => {
    if (args.columnName === 'quantity' || args.columnName === 'unitCost') {
      const qty = Number(args.columnName === 'quantity' ? args.value : args.rowData.quantity)
      const cost = Number(args.columnName === 'unitCost' ? args.value : args.rowData.unitCost)
      args.rowData.inventoryValue = Math.round(qty * cost * 100) / 100
    }
  }}
/>`,
      },
    ],
  },
  {
    id: 'dashboard-charts-maps',
    title: 'Dashboard — Charts + Maps',
    description: 'Executive KPI trends and global supply-chain map with navigation lines.',
    tabs: [
      {
        id: 'react',
        label: 'React',
        language: 'tsx',
        code: `<ChartComponent zoomSettings={{ enableMouseWheelZooming: true }} crosshair={{ enable: true }}>
  <Inject services={[LineSeries, Legend, Tooltip, Zoom, Crosshair]} />
  <SeriesCollectionDirective>
    <SeriesDirective dataSource={trend} xName="period" yName="inventoryValue" type="Line" />
    <SeriesDirective dataSource={trend} xName="period" yName="orderDemand" type="Line" />
  </SeriesCollectionDirective>
</ChartComponent>

<MapsComponent markerClick={(e) => openWarehouse(e.data)}>
  <LayerDirective
    shapeData={worldMap}
    markerSettings={[{ visible: true, dataSource: warehouses }]}
    navigationLineSettings={routes}
  />
</MapsComponent>`,
      },
    ],
  },
  {
    id: 'capacity-gantt',
    title: 'Capacity — Gantt + Scheduler',
    description: 'Dependency-driven production plan alongside resource timeline allocation.',
    tabs: [
      {
        id: 'react',
        label: 'React',
        language: 'tsx',
        code: `<GanttComponent
  dataSource={ganttData}
  taskFields={{
    id: 'TaskID', name: 'TaskName', startDate: 'StartDate', endDate: 'EndDate',
    progress: 'Progress', parentID: 'ParentID', dependency: 'Predecessor',
  }}
  enableVirtualization
  editSettings={{ allowEditing: true, allowTaskbarEditing: true }}
/>

<ScheduleComponent group={{ resources: ['Lines'] }} currentView="TimelineWeek">
  <ResourceDirective field="ResourceId" name="Lines" dataSource={resources} />
</ScheduleComponent>`,
      },
    ],
  },
  {
    id: 'analytics-pivot',
    title: 'Analytics — Pivot Table + Chart',
    description: 'Field list, grouping bar, calculated fields, and pivot chart toggle.',
    tabs: [
      {
        id: 'react',
        label: 'React',
        language: 'tsx',
        code: `<PivotViewComponent
  dataSourceSettings={{
    dataSource: rows,
    rows: [{ name: 'productCategory' }, { name: 'supplier' }],
    columns: [{ name: 'region' }, { name: 'country' }],
    values: [
      { name: 'revenue', caption: 'Revenue' },
      { name: 'delayDays', caption: 'Delay days', type: 'Avg' },
    ],
    calculatedFieldSettings: [
      { name: 'RevenuePerOrderQty', formula: '"Sum(revenue)"/"Sum(orderQuantity)"' },
    ],
  }}
  showFieldList
  showGroupingBar
  displayOption={{ view: 'Both' }}
/>`,
      },
    ],
  },
  {
    id: 'planning-spreadsheet',
    title: 'Planning Worksheet — Spreadsheet',
    description: 'Editable quarterly demand/inventory plan with formulas and variance.',
    tabs: [
      {
        id: 'react',
        label: 'React',
        language: 'tsx',
        code: `<SpreadsheetComponent
  showFormulaBar
  allowEditing
  created={() => {
    spreadsheet.insertSheet([{ name: 'Planning FY2026' }])
    spreadsheet.updateCell({ value: 'Annual Demand' }, 'J1')
    spreadsheet.updateCell({ formula: '=SUM(F2:I2)' }, 'J2')
    spreadsheet.updateCell({ formula: '=K2-D2' }, 'L2') // replenishment
  }}
/>`,
      },
    ],
  },
  {
    id: 'order-shipment-tracking',
    title: 'Order Detail — Maps + Timeline',
    description: 'Shipment path with origin/current/destination markers and event timeline.',
    tabs: [
      {
        id: 'react',
        label: 'React',
        language: 'tsx',
        code: `<MapsComponent>
  <LayerDirective
    markerSettings={[{ dataSource: [origin, current, destination] }]}
    navigationLineSettings={[{ latitude: [...], longitude: [...], width: 2 }]}
  />
</MapsComponent>

<TimelineComponent>
  <ItemsDirective>
    <ItemDirective content="Aug 24 — Picked" />
    <ItemDirective content="Aug 25 — Departed Chicago DC" />
    <ItemDirective content="Aug 27 — Out for delivery" />
  </ItemsDirective>
</TimelineComponent>`,
      },
    ],
  },
{
    id: 'warehouse-scheduler',
    title: 'Warehouses — Scheduler + TreeGrid',
    description: 'Dock timeline scheduling with resource grouping and bin hierarchy.',
    tabs: [
      {
        id: 'react',
        label: 'React',
        language: 'tsx',
        code: `<ScheduleComponent group={{ resources: ['Docks'] }} currentView="TimelineDay">
  <ResourceDirective field="DockId" name="Docks" dataSource={docks} textField="dockName" idField="dockId" />
  <ViewsDirective>
    <ViewDirective option="TimelineDay" />
    <ViewDirective option="TimelineWeek" />
  </ViewsDirective>
</ScheduleComponent>

<TreeGridComponent dataSource={locations} idMapping="id" parentIdMapping="parentId" treeColumnIndex={0} />`,
      },
    ],
  },
  {
    id: 'po-approval-stepper',
    title: 'Purchase Order — Stepper + PDF Viewer',
    description: 'Status workflow visualization with document viewing.',
    tabs: [
      {
        id: 'react',
        label: 'React',
        language: 'tsx',
        code: `<StepperComponent activeStep={activeStep}>
  <StepsDirective>
    {['Draft','Approval','Issued','Supplier Confirmed','In Transit','Received'].map((s) => (
      <StepDirective key={s} text={s} />
    ))}
  </StepsDirective>
</StepperComponent>

<PdfViewerComponent
  documentPath="https://cdn.syncfusion.com/content/pdf/pdf-succinctly.pdf"
  resourceUrl="https://cdn.syncfusion.com/ej2/34.2.5/dist/ej2-pdfviewer-lib"
/>`,
      },
    ],
  },
  {
    id: 'saved-views-notifications',
    title: 'Shell — Saved Views + Notifications',
    description: 'Local personalization and operational alerts with deep links.',
    tabs: [
      {
        id: 'react',
        label: 'React',
        language: 'tsx',
        code: `// Saved views (localStorage)
savedViewsService.save({
  name: 'My Inventory Exceptions',
  module: 'inventory',
  state: { search: '', filters: { status: 'Below Safety' } },
})

// Notifications ListView
<ListViewComponent
  dataSource={notifications}
  select={(e) => navigate(e.data.route)}
/>`,
      },
    ],
  },
]

export function getCodeSample(id: string) {
  return codeSamples.find((s) => s.id === id)
}

export function getCodeSamplesForPage(pageKey: string) {
  const map: Record<string, string[]> = {
    dashboard: ['dashboard-charts-maps', 'saved-views-notifications'],
    inventory: ['inventory-datamanager', 'inventory-batch-edit'],
    procurement: ['inventory-datamanager', 'po-approval-stepper'],
    orders: ['order-shipment-tracking'],
    capacity: ['capacity-gantt'],
    analytics: ['analytics-pivot', 'planning-spreadsheet'],
    planning: ['planning-spreadsheet'],
    warehouses: ['warehouse-scheduler', 'order-shipment-tracking'],
    suppliers: ['inventory-datamanager'],
  }
  return (map[pageKey] ?? []).map(getCodeSample).filter(Boolean) as CodeSample[]
}
