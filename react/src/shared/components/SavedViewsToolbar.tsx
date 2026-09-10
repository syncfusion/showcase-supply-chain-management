import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { ButtonComponent } from '@syncfusion/ej2-react-buttons'
import type { GridComponent } from '@syncfusion/ej2-react-grids'
import { DialogComponent } from '@syncfusion/ej2-react-popups'
import { TextBoxComponent } from '@syncfusion/ej2-react-inputs'
import { SafeDropDownList } from './SafeDropDownList'
import { SyncfusionMountDelay } from './SyncfusionMountDelay'
import { savedViewsService, type SavedView } from '../services/savedViews'

interface SavedViewsToolbarProps {
  module: string
  currentState: SavedView['state']
  gridRef?: RefObject<GridComponent | null>
  onApply: (state: SavedView['state']) => void
  onReset: () => void
}

export function SavedViewsToolbar({ module, currentState, gridRef, onApply, onReset }: SavedViewsToolbarProps) {
  const [views, setViews] = useState<SavedView[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  // The previous version mutated the dropdown's `value` and `dataSource` on the same tick
  // that the dialog closed. Syncfusion's internal DOM teardown raced React's reconciliation
  // and threw `NotFoundError: insertBefore`, leaving the page blank. We now defer both
  // the selection commit and the views refresh until after the dialog is fully closed,
  // and we force a clean re-mount of the DropDownList via a `key`.
  const [dropdownKey, setDropdownKey] = useState(0)
  const pendingSelectionRef = useRef<string | null>(null)
  const pendingSaveNameRef = useRef<string | null>(null)
  const pendingSaveStateRef = useRef<SavedView['state'] | null>(null)

  const readGridState = (): SavedView['state']['gridState'] => {
    const persisted = gridRef?.current?.getPersistData()
    if (!persisted) return undefined
    try {
      return JSON.parse(persisted) as Record<string, unknown>
    } catch {
      return undefined
    }
  }

  const applyGridState = (state: SavedView['state']) => {
    const gridState = state.gridState
    if (!gridState || !gridRef) return
    setTimeout(() => gridRef.current?.setProperties(gridState), 0)
  }

  const refresh = () => {
    setViews(savedViewsService.list(module))
    setDropdownKey((k) => k + 1)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module])

  // Stable dataSource reference — rebuilding the array on every render was the source of the
  // Syncfusion `insertBefore` NotFoundError that produced a blank page after saving a view.
  const dataSource = useMemo(
    () => [...views.map((v) => ({ id: v.id, name: v.name }))],
    [views],
  )

  // After the dialog finishes closing, commit the deferred save + selection so the dropdown
  // re-mounts with a matching value instead of clobbering nodes mid-teardown. A short timeout
  // ensures Syncfusion's dialog DOM nodes are fully removed before React inserts new ones.
  useEffect(() => {
    if (dialogOpen) return
    const saveName = pendingSaveNameRef.current
    if (saveName != null) {
      pendingSaveNameRef.current = null
      const saveState = pendingSaveStateRef.current ?? currentState
      pendingSaveStateRef.current = null
      const saved = savedViewsService.save({ name: saveName, module, state: saveState })
      refresh()
      pendingSelectionRef.current = saved.id
    }
    const pending = pendingSelectionRef.current
    if (pending == null) return
    const timer = setTimeout(() => {
      pendingSelectionRef.current = null
      setSelectedId(pending)
      setDropdownKey((k) => k + 1)
    }, 120)
    return () => clearTimeout(timer)
  }, [dialogOpen, module, currentState])

  const resetGridState = () => {
    const gridObj = gridRef?.current;
    if (!gridObj) return;
    // 1. Clear filters and sorting
    gridObj.clearFiltering();
    gridObj.clearSorting();

    // 2. Clear grouping if group module is used
    if (gridObj.clearGrouping) {
        gridObj.clearGrouping();
    }

    // 3. Reset pagination back to the first page
    if (gridObj.goToPage) {
        gridObj.goToPage(1);
    }

    // 4. If persistence is enabled, clear local storage state
    window.localStorage.removeItem(gridObj.getPersistData ? gridObj.getPersistData() : 'gridGrid');

    // 5. Refresh the content to reflect changes
    gridObj.refresh();
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <SyncfusionMountDelay>
        <SafeDropDownList
          key={`saved-views-${dropdownKey}`}
          dataSource={dataSource as unknown as { [key: string]: object }[]}
          fields={{ text: 'name', value: 'id' }}
          value={selectedId}
          width={180}
          onChange={(e) => {
            const id = String(e.value ?? '')
            setSelectedId(id)
            const view = views.find((v) => v.id === id)
            if (view) {
              onApply(view.state)
              applyGridState(view.state)
            }
          }}
          placeholder="Saved views"
        />
      </SyncfusionMountDelay>
      <ButtonComponent
        cssClass="e-outline"
        onClick={() => {
          setName('')
          setDialogOpen(true)
        }}
      >
        Save View
      </ButtonComponent>
      <ButtonComponent
        cssClass="e-flat"
        onClick={() => {
          onReset()
          setSelectedId('')
          setDropdownKey((k) => k + 1)
          resetGridState()
        }}
      >
        Reset
      </ButtonComponent>
      <ButtonComponent
        cssClass="e-flat e-danger"
        disabled={!selectedId}
        onClick={() => {
          savedViewsService.remove(selectedId)
          setSelectedId('')
          refresh()
          resetGridState()
        }}
      >
        Delete View
      </ButtonComponent>

      <DialogComponent
        header="Save view"
        visible={dialogOpen}
        isModal
        cssClass="agm-saved-view-dialog"
        width="400px"
        showCloseIcon
        close={() => setDialogOpen(false)}
        buttons={[
          {
            click: () => {
              if (!name.trim()) return
              pendingSaveStateRef.current = { ...currentState, gridState: readGridState() }
              pendingSaveNameRef.current = name.trim()
              setName('')
              setDialogOpen(false)
            },
            buttonModel: { content: 'Save', isPrimary: true },
          },
          {
            click: () => setDialogOpen(false),
            buttonModel: { content: 'Cancel' },
          },
        ]}
      >
        <div className="agm-filter-field">
          <label>View name</label>
          <TextBoxComponent
            placeholder="e.g. My Inventory Exceptions"
            value={name}
            input={(e) => setName(e.value ?? '')}
          />
        </div>
      </DialogComponent>
    </div>
  )
}
