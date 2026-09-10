import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getNetworkSimulation, setNetworkSimulation, type NetworkSimulation } from '../../shared/services/http'

/** BDS Design System themes — maps to Syncfusion Tailwind3 / Tailwind3Dark */
export type ThemeMode = 'bds-light' | 'bds-dark'

interface SettingsContextValue {
  networkSimulation: NetworkSimulation
  setSimulation: (mode: NetworkSimulation) => void
  showcaseMode: boolean
  setShowcaseMode: (value: boolean) => void
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  /** Syncfusion EJ2 chart/map theme name */
  syncfusionTheme: 'Tailwind3' | 'Tailwind3Dark'
  isDark: boolean
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

function normalizeTheme(value: string | null): ThemeMode {
  if (value === 'bds-dark' || value === 'fluent-dense') return 'bds-dark'
  return 'bds-light'
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme
  document.body.classList.toggle('e-dark-mode', theme === 'bds-dark')
  localStorage.setItem('agm.theme', theme)
  // Syncfusion's chart/map components read the body class on mount and
  // bake the series / axis / legend palette into SVG attributes. They
  // don't re-read it later, so a pure class swap leaves stale `fill`
  // attributes that conflict with our theme tokens (e.g. legend text
  // stuck on Syncfusion's light-mode grey on a dark background). The
  // CSS rules in agm.css use `!important` to mask those stale attributes,
  // but a `resize` event is what makes Syncfusion re-paint the whole
  // chart — series, axes, legend, crosshair — with the new palette.
  // Defer to the next frame so the class toggle is committed first.
  if (typeof window !== 'undefined') {
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'))
    })
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [networkSimulation, setSimulationState] = useState<NetworkSimulation>(getNetworkSimulation())
  const [showcaseMode, setShowcaseMode] = useState(true)
  const [theme, setThemeState] = useState<ThemeMode>(() => normalizeTheme(localStorage.getItem('agm.theme')))

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const isDark = theme === 'bds-dark'
  const syncfusionTheme: 'Tailwind3' | 'Tailwind3Dark' = isDark ? 'Tailwind3Dark' : 'Tailwind3'

  const value = useMemo(
    () => ({
      networkSimulation,
      setSimulation: (mode: NetworkSimulation) => {
        setNetworkSimulation(mode)
        setSimulationState(mode)
      },
      showcaseMode,
      setShowcaseMode,
      theme,
      setTheme: (next: ThemeMode) => {
        setThemeState(next)
        applyTheme(next)
      },
      syncfusionTheme,
      isDark,
    }),
    [networkSimulation, showcaseMode, theme, syncfusionTheme, isDark],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
