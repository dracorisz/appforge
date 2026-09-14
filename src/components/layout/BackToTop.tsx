import React from 'react'
import { ArrowUp } from 'lucide-react'
import { IconButton } from '@/components/ui'

export function BackToTop() {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const toggle = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', toggle)
    return () => window.removeEventListener('scroll', toggle)
  }, [])

  if (!visible) return null

  return (
    <IconButton
      label="Back to top"
      icon={<ArrowUp />}
      variant="primary"
      size="md"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="no-print fixed bottom-4 right-4 z-40 shadow-xl"
    />
  )
}
