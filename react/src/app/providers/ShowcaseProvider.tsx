import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export interface ShowcaseComponentInfo {
  name: string
  features: string[]
  docsUrl?: string
}

interface ShowcaseContextValue {
  open: boolean
  components: ShowcaseComponentInfo[]
  setComponents: (components: ShowcaseComponentInfo[]) => void
  toggle: () => void
  close: () => void
}

const ShowcaseContext = createContext<ShowcaseContextValue | null>(null)

export function ShowcaseProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [components, setComponents] = useState<ShowcaseComponentInfo[]>([])

  const value = useMemo(
    () => ({
      open,
      components,
      setComponents,
      toggle: () => setOpen((v) => !v),
      close: () => setOpen(false),
    }),
    [open, components],
  )

  return <ShowcaseContext.Provider value={value}>{children}</ShowcaseContext.Provider>
}

export function useShowcase() {
  const ctx = useContext(ShowcaseContext)
  if (!ctx) throw new Error('useShowcase must be used within ShowcaseProvider')
  return ctx
}
