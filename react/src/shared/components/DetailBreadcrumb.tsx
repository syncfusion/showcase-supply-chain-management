import { useNavigate } from 'react-router-dom'
import { BreadcrumbComponent } from '@syncfusion/ej2-react-navigations/breadcrumb'

export interface Crumb {
  text: string
  url?: string
}

export function DetailBreadcrumb({ items }: { items: Crumb[] }) {
  const navigate = useNavigate()
  return (
    <BreadcrumbComponent
      enableNavigation={false}
      items={items.map((item) => ({ text: item.text, url: item.url ?? '' }))}
      itemClick={(args) => {
        const url = (args.item as { url?: string })?.url
        if (url) {
          args.cancel = true
          navigate(url)
        }
      }}
    />
  )
}
