import { useEffect, useState, type ReactNode } from 'react'

/**
 * Syncfusion 34.2.x React wrappers can throw `NotFoundError: removeChild` on React 19
 * when a component mounts/unmounts during the very first paint. Deferring the mount
 * by one animation frame lets React finish its initial DOM setup before Syncfusion's
 * native code attaches event listeners and popup nodes.
 */
export function SyncfusionMountDelay({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  if (!ready) return null
  return <>{children}</>
}
