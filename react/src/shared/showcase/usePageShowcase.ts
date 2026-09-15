import { useEffect } from 'react'
import { useShowcase, type ShowcaseComponentInfo } from '../../app/providers/ShowcaseProvider'

export function usePageShowcase(components: ShowcaseComponentInfo[]) {
  const { setComponents } = useShowcase()
  useEffect(() => {
    setComponents(components)
  }, [components, setComponents])
}
