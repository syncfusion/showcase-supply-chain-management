import { useRef, useCallback } from 'react'
import {
  DropDownListComponent,
  type ChangeEventArgs,
  type DropDownListModel,
} from '@syncfusion/ej2-react-dropdowns'

/**
 * Syncfusion 34.2.x React wrappers + React 19 can throw
 * `NotFoundError: Failed to execute 'removeChild' on 'Node'` when a dropdown
 * fires its change event and React immediately reconciles a state update while
 * the native component is still detaching its popup/input nodes.
 *
 * This wrapper defers the change callback until after the current paint/microtask
 * so Syncfusion's DOM bookkeeping is complete before React re-renders. It also
 * forwards refs and props transparently.
 */
type SafeDropDownListProps = DropDownListModel & {
  onChange?: (args: ChangeEventArgs) => void
}

export function SafeDropDownList(props: SafeDropDownListProps) {
  const { onChange, ...rest } = props
  const internalRef = useRef<DropDownListComponent | null>(null)

  const handleChange = useCallback(
    (args: ChangeEventArgs) => {
      // Deferring by a microtask is usually enough; use rAF as a fallback for
      // browsers where the native component's DOM cleanup happens after paint.
      const invoke = () => onChange?.(args)
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => {
          // One extra microtask ensures React batches this with the next commit,
          // not the currently-in-flight one.
          Promise.resolve().then(invoke)
        })
      } else {
        Promise.resolve().then(invoke)
      }
    },
    [onChange],
  )

  return <DropDownListComponent {...rest} change={handleChange} ref={internalRef} />
}
