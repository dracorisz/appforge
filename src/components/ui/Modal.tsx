import React from 'react'
import { X } from 'lucide-react'

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
      <section role="dialog" aria-modal="true" aria-label={title} className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        <header className="sticky top-0 flex min-h-12 items-center justify-between gap-3 border-b border-border bg-background px-4 py-2">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close"><X className="h-4 w-4" /></button>
        </header>
        <div className="p-4 sm:p-5">{children}</div>
      </section>
    </div>
  )
}
