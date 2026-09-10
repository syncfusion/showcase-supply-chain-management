import { AppRouter } from './app/routing/AppRouter'
import { ShowcaseProvider } from './app/providers/ShowcaseProvider'
import { SettingsProvider } from './app/providers/SettingsProvider'
import { AppErrorBoundary } from './shared/components/AppErrorBoundary'

export default function App() {
  return (
    <AppErrorBoundary>
      <SettingsProvider>
        <ShowcaseProvider>
          <AppRouter />
        </ShowcaseProvider>
      </SettingsProvider>
    </AppErrorBoundary>
  )
}
