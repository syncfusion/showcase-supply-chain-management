import { useEffect, useState } from 'react'
import {
  GanttComponent,
  Inject,
  Edit,
  Filter,
  Sort,
  Selection,
  Toolbar,
  ColumnsDirective,
  ColumnDirective,
  DayMarkers,
  VirtualScroll,
} from '@syncfusion/ej2-react-gantt'
import {
  ScheduleComponent,
  ViewsDirective,
  ViewDirective,
  ResourcesDirective,
  ResourceDirective,
  Inject as ScheduleInject,
  TimelineViews,
  TimelineMonth,
  Day,
  Week,
  Resize,
  DragAndDrop,
} from '@syncfusion/ej2-react-schedule'
import {
  GridComponent,
  ColumnsDirective as GridColumns,
  ColumnDirective as GridColumn,
  Inject as GridInject,
  Sort as GridSort,
  Filter as GridFilter,
  Page,
} from '@syncfusion/ej2-react-grids'
import { TooltipComponent } from '@syncfusion/ej2-react-popups'
import { capacityRepository } from '../../shared/services/repositories'
import type { ProductionTask } from '../../shared/models/types'
import { usePageShowcase } from '../../shared/showcase/usePageShowcase'

function severityClass(severity: string) {
  if (/critical/i.test(severity)) return 'critical'
  if (/high/i.test(severity)) return 'warning'
  return 'healthy'
}

const showcase = [
  {
    name: 'React Gantt',
    features: [
      'Hierarchical tasks',
      'Dependencies',
      'Progress',
      'Task editing',
      'Timeline',
      'Filtering / sorting',
      'Virtual scrolling',
    ],
  },
  {
    name: 'React Scheduler',
    features: ['Resource allocation', 'Day/Week/Timeline views', 'Drag-and-drop', 'Resize'],
  },
]

const exceptions = [
  { id: 1, type: 'Line capacity exceeded', plant: 'Chicago Manufacturing Plant', line: 'Assembly Line A', severity: 'High' },
  { id: 2, type: 'Material unavailable', plant: 'Munich Manufacturing Plant', line: 'Assembly Line B', severity: 'Critical' },
  { id: 3, type: 'Supplier delay', plant: 'Pune Manufacturing Plant', line: 'Assembly Line A', severity: 'High' },
  { id: 4, type: 'Maintenance conflict', plant: 'Monterrey Plant Warehouse', line: 'Assembly Line C', severity: 'Medium' },
  { id: 5, type: 'Resource unavailable', plant: 'Ho Chi Minh Plant Warehouse', line: 'Testing Station 1', severity: 'High' },
]

export function CapacityPage() {
  usePageShowcase(showcase)
  const [tasks, setTasks] = useState<ProductionTask[]>([])

  useEffect(() => {
    capacityRepository.list().then(setTasks)
  }, [])

  const ganttData = tasks.map((t) => ({
    TaskID: t.id,
    TaskName: t.name,
    StartDate: new Date(t.startDate),
    EndDate: new Date(t.endDate),
    Progress: Math.round(t.progress * 100),
    ParentID: t.parentId || null,
    Predecessor: t.predecessor ?? undefined,
    Resource: t.resource,
    Milestone: t.isMilestone,
  }))

  const resources = Array.from(new Set(tasks.map((t) => t.productionLine).filter(Boolean))).map((name, i) => ({
    resourceId: i + 1,
    resourceName: name,
  }))

  const scheduleEvents = tasks
    .filter((t) => !t.parentId || t.productionLine)
    .filter((t) => !t.name.includes('Plant') && t.productionLine)
    .slice(0, 80)
    .map((t, i) => ({
      Id: i + 1,
      Subject: t.name,
      StartTime: new Date(t.startDate),
      EndTime: new Date(t.endDate),
      ResourceId: resources.find((r) => r.resourceName === t.productionLine)?.resourceId ?? 1,
    }))

  return (
    <div>
      <div className="agm-page-header">
        <div>
          <h1>Production & Capacity Planning</h1>
          <p>Coordinate production schedules, resource allocation, dependencies, and capacity constraints across lines.</p>
        </div>
      </div>

      <div className="agm-panel">
        <h2 className="agm-panel__title">Production plan</h2>
        <GanttComponent
          dataSource={ganttData}
          height="480px"
          taskFields={{
            id: 'TaskID',
            name: 'TaskName',
            startDate: 'StartDate',
            endDate: 'EndDate',
            progress: 'Progress',
            parentID: 'ParentID',
            dependency: 'Predecessor',
            milestone: 'Milestone',
          }}
          treeColumnIndex={1}
          allowSelection
          allowSorting
          allowFiltering
          enableVirtualization
          editSettings={{ allowEditing: true, allowTaskbarEditing: true, mode: 'Auto' }}
          toolbar={['ExpandAll', 'CollapseAll', 'ZoomIn', 'ZoomOut', 'ZoomToFit']}
          labelSettings={{ taskLabel: 'Progress' }}
          splitterSettings={{columnIndex: 2}}
        >
          <ColumnsDirective>
            <ColumnDirective field="TaskID" headerText="ID" width={110} />
            <ColumnDirective field="TaskName" headerText="Task" width={260} />
            <ColumnDirective field="StartDate" headerText="Start" type="date" format="MM/dd/yyyy" />
            <ColumnDirective field="EndDate" headerText="End" type="date" format="MM/dd/yyyy" />
            <ColumnDirective field="Progress" headerText="Progress" />
            <ColumnDirective field="Resource" headerText="Resource" width={140} />
          </ColumnsDirective>
          <Inject services={[Edit, Filter, Sort, Selection, Toolbar, DayMarkers, VirtualScroll]} />
        </GanttComponent>
      </div>

      <div className="agm-grid-2 agm-capacity-sections">
        <div className="agm-panel">
          <h2 className="agm-panel__title">Capacity exceptions</h2>
          <GridComponent dataSource={exceptions} allowPaging allowSorting allowFiltering height={280} pageSettings={{ pageSize: 6 }}>
            <GridInject services={[GridSort, GridFilter, Page]} />
            <GridColumns>
              <GridColumn field="type" headerText="Exception" width={180} />
              <GridColumn
                field="plant"
                headerText="Plant"
                width={130}
                template={(props: { plant?: string }) => (
                  <TooltipComponent content={props.plant ?? ''} opensOn="Hover" target=".plant-tooltip" position="TopCenter">
                    <span className="plant-tooltip">{props.plant}</span>
                  </TooltipComponent>
                )}
              />
              <GridColumn field="line" headerText="Line" width={140} />
              <GridColumn
                field="severity"
                headerText="Severity"
                width={110}
                template={(props: { severity?: string }) => {
                  const severity = String(props.severity ?? '')
                  return <span className={`agm-status ${severityClass(severity)}`}>{severity}</span>
                }}
              />
            </GridColumns>
          </GridComponent>
        </div>
        <div className="agm-panel">
          <h2 className="agm-panel__title">Production resource schedule</h2>
          <ScheduleComponent
            height="320px"
            selectedDate={new Date()}
            currentView="TimelineWeek"
            group={{ resources: ['Lines'] }}
            eventSettings={{ dataSource: scheduleEvents }}
          >
            <ResourcesDirective>
              <ResourceDirective
                field="ResourceId"
                title="Line"
                name="Lines"
                dataSource={resources}
                textField="resourceName"
                idField="resourceId"
              />
            </ResourcesDirective>
            <ViewsDirective>
              <ViewDirective option="Day" />
              <ViewDirective option="Week" />
              <ViewDirective option="TimelineWeek" />
              <ViewDirective option="TimelineMonth" />
            </ViewsDirective>
            <ScheduleInject services={[Day, Week, TimelineViews, TimelineMonth, Resize, DragAndDrop]} />
          </ScheduleComponent>
        </div>
      </div>
    </div>
  )
}
