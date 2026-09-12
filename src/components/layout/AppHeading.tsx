import React from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowLeftRight, Binary, Braces, Calendar, CloudSun, Code, Eraser, FileCode, FileText, Gamepad2, Hash, Image, LayoutDashboard, Lock, Palette, QrCode, Regex, Search, Sparkles, Table2, Type, Wrench } from 'lucide-react'
import { getAllApps } from '@/lib/registry'
import { DragonArenaIcon } from '@/components/dashboard/DragonArenaIcon'

const icons = { ArrowLeftRight, Binary, Braces, Calendar, CloudSun, Code, Eraser, FileCode, FileText, Gamepad2, Hash, Image, LayoutDashboard, Lock, Palette, QrCode, Regex, Search, Sparkles, Table2, Type, Wrench }
const aliases: Record<string, string> = { '/apps/any-converter': '/apps/data-converter', '/apps/dns-txt-checker': '/apps/dns-checker', '/pf-weather-now': '/apps/weather-now', '/pf-crypto-track': '/apps/crypto-track' }

/** One app identity and one line of purpose, shared by public and account tools. */
export function AppHeading() {
  const { pathname } = useLocation()
  const app = getAllApps().find((item) => item.route === (aliases[pathname] || pathname))
  if (!app) return null
  const Icon = app.id === 'ai-dragon-arena' ? DragonArenaIcon : icons[app.icon as keyof typeof icons] || Wrench
  return <header className="app-heading w-full min-w-0">
    <div className="flex min-w-0 items-center gap-2.5">
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
      <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-foreground">{app.name}</h1>
    </div>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{app.description}</p>
  </header>
}
