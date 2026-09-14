import React from 'react'
import { X } from 'lucide-react'
import { IconButton } from './IconButton'

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  React.useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKey) }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close modal" className="fixed inset-0 cursor-default bg-black/70" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-label={title} className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl border border-border/70 bg-card shadow-xl">
        <header className="sticky top-0 flex min-h-12 items-center justify-between gap-4 border-b border-border/70 bg-card px-4 py-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          <IconButton label="Close" icon={<X />} onClick={onClose} />
        </header>
        <div className="p-4">{children}</div>
      </section>
    </div>
  )
}
