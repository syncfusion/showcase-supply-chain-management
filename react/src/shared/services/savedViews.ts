const STORAGE_KEY = 'agm.savedViews'

export interface SavedView {
  id: string
  name: string
  module: string
  createdAt: string
  state: {
    search?: string
    filters?: Record<string, string>
    sort?: { field: string; direction: string }
    group?: string[]
    visibleColumns?: string[]
    gridState?: Record<string, unknown>
  }
}

function readAll(): SavedView[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedView[]) : []
  } catch {
    return []
  }
}

function writeAll(views: SavedView[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views))
}

export const savedViewsService = {
  list(module: string) {
    return readAll().filter((v) => v.module === module)
  },
  save(view: Omit<SavedView, 'id' | 'createdAt'> & { id?: string }) {
    const all = readAll()
    const id = view.id ?? `view-${Date.now()}`
    const next: SavedView = {
      id,
      name: view.name,
      module: view.module,
      createdAt: new Date().toISOString(),
      state: view.state,
    }
    const idx = all.findIndex((v) => v.id === id)
    if (idx >= 0) all[idx] = next
    else all.push(next)
    writeAll(all)
    return next
  },
  rename(id: string, name: string) {
    const all = readAll()
    const view = all.find((v) => v.id === id)
    if (!view) return null
    view.name = name
    writeAll(all)
    return view
  },
  remove(id: string) {
    writeAll(readAll().filter((v) => v.id !== id))
  },
  reset(module: string) {
    writeAll(readAll().filter((v) => v.module !== module))
  },
}
