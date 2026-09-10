import { createRoot } from 'react-dom/client'

import { BrowserRouter } from 'react-router-dom'
import { registerLicense } from '@syncfusion/ej2-base'
import './shared/syncfusion/styles'
import './shared/theme/agm.css'
import { getPublicBasePath } from './basePath';
import App from './App'

declare global {
  interface Window {
    __AGM_CONFIG__?: { syncfusionLicense?: string }
  }
}

// Prefer runtime config.js (Docker / hosted), then Vite env for local dev.
const license =
  window.__AGM_CONFIG__?.syncfusionLicense?.trim() ||
  (import.meta.env.VITE_SYNCFUSION_LICENSE as string | undefined)?.trim() ||
  ''

registerLicense(license)

// NOTE: React 19's StrictMode intentionally double-invokes effects to surface lifecycle bugs.
// Syncfusion 34.2.x's React wrappers (e.g. DropDownListComponent, AutoCompleteComponent,
// TextBoxComponent) still rely on a single-mount assumption — under StrictMode the second
// mount of the same instance tries to attach to a DOM node that the first teardown has
// already detached, which throws `NotFoundError: removeChild` and unmounts the entire
// tree, leaving the user with a blank page. We disable StrictMode at the root and rely on
// the AppErrorBoundary for any residual render errors.
createRoot(document.getElementById('root')!).render(
 
    <BrowserRouter basename={getPublicBasePath()}>
      <App />
    </BrowserRouter>
 ,
)