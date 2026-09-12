import { AppHeading } from '@/components/layout/AppHeading'
import { DesktopBuddyTransparencyLab } from '@/components/dashboard/DesktopBuddyTransparencyLab'

export default function BackgroundRemover() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">
      <section className="surface-card rounded-2xl border p-5 sm:p-6"><AppHeading /></section>
      <DesktopBuddyTransparencyLab standalone />
    </div>
  )
}
