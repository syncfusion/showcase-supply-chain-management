import { useEffect, useState } from 'react'
import { ButtonComponent } from '@syncfusion/ej2-react-buttons'
import { TabComponent, TabItemDirective, TabItemsDirective } from '@syncfusion/ej2-react-navigations'
import { DialogComponent } from '@syncfusion/ej2-react-popups'
import { getCodeSample, getCodeSamplesForPage, type CodeSample } from './codeSamples'

interface CodeViewerProps {
  pageKey?: string
  sampleId?: string
  open: boolean
  onClose: () => void
}

export function CodeViewerDialog({ pageKey, sampleId, open, onClose }: CodeViewerProps) {
  const [samples, setSamples] = useState<CodeSample[]>([])
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    if (!open) return
    const list = sampleId
      ? ([getCodeSample(sampleId)].filter(Boolean) as CodeSample[])
      : getCodeSamplesForPage(pageKey ?? '')
    setSamples(list)
    setActiveId(list[0]?.id ?? '')
  }, [open, pageKey, sampleId])

  const active = samples.find((s) => s.id === activeId) ?? samples[0]

  return (
    <DialogComponent
      header="View code"
      visible={open}
      width="860px"
      isModal
      showCloseIcon
      close={onClose}
      cssClass="agm-code-viewer"
    >
      {!active && <p className="agm-muted">No code samples registered for this page yet.</p>}
      {active && (
        <div>
          {samples.length > 1 && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {samples.map((s) => (
                <ButtonComponent
                  key={s.id}
                  cssClass={s.id === active.id ? 'e-primary' : 'e-outline'}
                  onClick={() => setActiveId(s.id)}
                >
                  {s.title.split('—')[0].trim()}
                </ButtonComponent>
              ))}
            </div>
          )}
          <h3 style={{ margin: '0 0 0.35rem', fontFamily: 'var(--agm-display)' }}>{active.title}</h3>
          <p className="agm-muted" style={{ marginTop: 0 }}>
            {active.description}
          </p>
          <TabComponent heightAdjustMode="Content">
            <TabItemsDirective>
              {active.tabs.map((tab) => (
                <TabItemDirective
                  key={tab.id}
                  header={{ text: tab.label }}
                  content={() => (
                    <pre className="agm-code-block">
                      <code>{tab.code}</code>
                    </pre>
                  )}
                />
              ))}
            </TabItemsDirective>
          </TabComponent>
          {active.docsUrl && (
            <p style={{ marginTop: '0.75rem' }}>
              <a href={active.docsUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--agm-brand)' }}>
                View Syncfusion documentation →
              </a>
            </p>
          )}
        </div>
      )}
    </DialogComponent>
  )
}
