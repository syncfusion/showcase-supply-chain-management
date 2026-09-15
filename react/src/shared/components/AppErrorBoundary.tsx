import { Component, type ErrorInfo, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Top-level error boundary. Without it, any uncaught render error from Syncfusion's
 * native-DOM teardown (e.g. `NotFoundError: removeChild`) unmounts the whole tree and
 * leaves the user looking at a blank page. We catch the failure, show a meaningful
 * Toast-style notification banner, render a recovery panel with the error message,
 * and offer "Try again" / "Reload" / "Back to dashboard" escape hatches.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false, error: null }
  private toastEl: HTMLDivElement | null = null

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[AppErrorBoundary] Caught render error:', error, info)
  }

  componentDidUpdate(_prevProps: AppErrorBoundaryProps, prevState: AppErrorBoundaryState) {
    if (this.state.hasError && !prevState.hasError) {
      this.showErrorToast()
    }
    if (!this.state.hasError && prevState.hasError) {
      this.removeErrorToast()
    }
  }

  componentWillUnmount() {
    this.removeErrorToast()
  }

  private showErrorToast() {
    if (typeof document === 'undefined') return
    if (document.getElementById('agm-app-error-toast')) return
    this.toastEl = document.createElement('div')
    this.toastEl.id = 'agm-app-error-toast'
    this.toastEl.setAttribute('role', 'alert')
    this.toastEl.setAttribute('aria-live', 'assertive')
    Object.assign(this.toastEl.style, {
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: '2147483647',
      maxWidth: '380px',
      padding: '0.85rem 1rem',
      borderRadius: '8px',
      background: '#7f1d1d',
      color: '#fff',
      boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '0.9rem',
      lineHeight: '1.4',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.6rem',
      animation: 'agm-app-error-toast-in 200ms ease-out',
    } satisfies Partial<CSSStyleDeclaration>)
    this.toastEl.innerHTML = `
      <div style="flex:1">
        <div style="font-weight:600;margin-bottom:0.15rem">Page failed to render</div>
        <div style="opacity:0.92">A rendering error interrupted the page. Use the recovery panel below to reload or navigate away.</div>
      </div>
      <button type="button" aria-label="Dismiss" style="background:transparent;border:0;color:inherit;cursor:pointer;font-size:1rem;line-height:1;padding:0 0.25rem">✕</button>
    `
    const closeBtn = this.toastEl.querySelector('button')
    closeBtn?.addEventListener('click', () => this.removeErrorToast())
    document.body.appendChild(this.toastEl)
    this.injectKeyframes()
  }

  private removeErrorToast() {
    if (this.toastEl) {
      this.toastEl.remove()
      this.toastEl = null
    }
  }

  private injectKeyframes() {
    if (typeof document === 'undefined') return
    if (document.getElementById('agm-app-error-toast-styles')) return
    const style = document.createElement('style')
    style.id = 'agm-app-error-toast-styles'
    style.textContent = `
      @keyframes agm-app-error-toast-in {
        from { transform: translateY(-12px); opacity: 0; }
        to   { transform: translateY(0); opacity: 1; }
      }
    `
    document.head.appendChild(style)
  }

  private handleReset = () => {
    this.removeErrorToast()
    this.setState({ hasError: false, error: null })
  }

  private handleReload = () => {
    this.removeErrorToast()
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        role="alert"
        style={{
          margin: '2rem auto',
          maxWidth: 720,
          padding: '1.5rem',
          borderRadius: 12,
          background: 'var(--agm-panel-bg, #fff)',
          border: '1px solid #f0c9c9',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          color: '#1f2937',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#b91c1c' }}>
          Something went wrong rendering this page
        </h1>
        <p style={{ marginTop: '0.5rem', color: '#4b5563' }}>
          A rendering error interrupted the page. This is most often caused by a third-party
          component tearing down its DOM at the same time React was reconciling an update
          (commonly when a Syncfusion dialog closes while a dropdown is updating).
        </p>
        {this.state.error && (
          <pre
            style={{
              marginTop: '0.75rem',
              padding: '0.75rem',
              borderRadius: 8,
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              fontSize: '0.8rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: '#111827',
            }}
          >
            {this.state.error.message}
          </pre>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 6,
              border: '1px solid transparent',
              background: '#7E56D8',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Reload page
          </button>
          <a
            href="/dashboard"
            onClick={this.removeErrorToast}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              textDecoration: 'none',
              color: '#111827',
              background: '#fff',
            }}
          >
            Go to dashboard
          </a>
        </div>
      </div>
    )
  }
}
