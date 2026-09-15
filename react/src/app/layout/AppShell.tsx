import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ButtonComponent } from '@syncfusion/ej2-react-buttons'
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns'
import { DialogComponent } from '@syncfusion/ej2-react-popups'
import { useSettings, type ThemeMode } from '../providers/SettingsProvider'
import { apiGet } from '../../shared/services/http'
import { SyncfusionMountDelay } from '../../shared/components/SyncfusionMountDelay'

import { ListViewComponent } from '@syncfusion/ej2-react-lists'

const navItems = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/procurement', label: 'Procurement' },
  { to: '/suppliers', label: 'Suppliers' },
  { to: '/orders', label: 'Orders' },
  { to: '/warehouses', label: 'Warehouses' },
  { to: '/capacity', label: 'Capacity Planning' },
  { to: '/analytics', label: 'Analytics' },
]

interface NotificationItem {
  id: string
  title: string
  category: string
  severity: string
  route: string
  time: string
}

function NotificationTemplate(props: Partial<NotificationItem>) {
  const severity = String(props.severity ?? 'info').toLowerCase()

  return (
    <div className="agm-notif__item">
      <span className={`agm-notif__dot agm-notif__dot--${severity}`} aria-hidden="true" />
      <div className="agm-notif__body">
        <div className="agm-notif__title">{props.title}</div>
        <div className="agm-notif__category">
          <span>{props.category}</span>
          <span className="agm-notif__separator" aria-hidden="true">
            /
          </span>
          <span className="agm-notif__action">
            Open workspace <span aria-hidden="true">&gt;</span>
          </span>
        </div>
      </div>
      <div className="agm-notif__aside">
        <span className={`agm-notif__sev agm-notif__sev--${severity}`}>{props.severity}</span>
        <span className="agm-notif__time">{props.time}</span>
      </div>
    </div>
  )
}

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const navigate = useNavigate()
  const { theme, setTheme } = useSettings()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [notifOpen, setNotifOpen] = useState(false)

  const themes = useMemo<{ id: ThemeMode; label: string }[]>(
    () => [
      { id: 'bds-light', label: 'Light' },
      { id: 'bds-dark', label: 'Dark' },
    ],
    [],
  )

  useEffect(() => {
    apiGet<{ count: number; items: NotificationItem[] }>('/notifications')
      .then((res) => setNotifications(res.items))
      .catch(() => undefined)
  }, [])

  return (
    <div className="agm-app">
      <aside className="agm-sidebar">
        <div className="agm-brand">
          <div className="agm-brand__mark">Apex Global Manufacturing</div>
          <div className="agm-brand__sub">Supply Chain Command Center</div>
        </div>
        <nav className="agm-nav" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `agm-nav__link${isActive ? ' is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        
      </aside>

      <div className="agm-main">
        <header className="agm-topbar">
          <div className="agm-topbar__title">{title}</div>
          <div className="agm-topbar__actions">
            <SyncfusionMountDelay>
              <DropDownListComponent
                id="theme-mode"
                dataSource={themes as unknown as { [key: string]: object }[]}
                fields={{ text: 'label', value: 'id' }}
                value={theme}
                width={130}
                change={(e) => setTheme(e.value as ThemeMode)}
                placeholder="Theme"
              />
            </SyncfusionMountDelay>
            <ButtonComponent cssClass="e-outline" onClick={() => setNotifOpen(true)}>
              Notifications ({notifications.length})
            </ButtonComponent>
          </div>
        </header>
        <main className="agm-content">{children}</main>
      </div>

      <DialogComponent
        id="notifications-dialog"
        className="agm-notif-dialog"
        header="Notifications"
        visible={notifOpen}
        width="480px"
        showCloseIcon
        isModal
        closeOnEscape
        animationSettings={{ effect: 'FadeZoom', duration: 220, delay: 0 }}
        overlayClick={() => setNotifOpen(false)}
        open={() => setNotifOpen(true)}
        close={() => setNotifOpen(false)}
      >
        <div className="agm-notif__summary">
            <div className="agm-notif__eyebrow">{notifications.length ? `${notifications.length} items need attention` : 'Everything is up to date'}</div>
        </div>
        {notifications.length ? (
          <div>
            <ListViewComponent
              dataSource={notifications as unknown as { [key: string]: object }[]}
              fields={{ id: 'id', text: 'title' }}
              cssClass="agm-notif__list"
              template={(props: Partial<NotificationItem>) => <NotificationTemplate {...props} />}
              select={(e) => {
                const item = e.data as NotificationItem
                if (item?.route) {
                  setNotifOpen(false)
                  navigate(item.route)
                }
              }}
            />
          </div>
        ) : (
          <div className="agm-notif__empty">
            <span className="agm-notif__empty-icon" aria-hidden="true">✓</span>
            <strong>No active notifications</strong>
            <span>New operational alerts will appear here.</span>
          </div>
        )}
        <div className="agm-notif__footer">Select an alert to open the related workspace</div>
      </DialogComponent>

    </div>
  )
}
