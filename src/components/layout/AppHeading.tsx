import React from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowLeftRight, Binary, Braces, Calendar, CloudSun, Code, Eraser, FileCode, FileText, Gamepad2, Hash, Image, LayoutDashboard, Lock, Palette, QrCode, Regex, Search, Sparkles, Table2, Type, Wrench } from 'lucide-react'
import { getAllApps } from '@/lib/registry'
import { DragonArenaIcon } from '@/components/dashboard/DragonArenaIcon'
import { Heading } from '@/components/ui'

const icons = { ArrowLeftRight, Binary, Braces, Calendar, CloudSun, Code, Eraser, FileCode, FileText, Gamepad2, Hash, Image, LayoutDashboard, Lock, Palette, QrCode, Regex, Search, Sparkles, Table2, Type, Wrench }
const aliases: Record<string, string> = { '/apps/any-converter': '/apps/data-converter', '/apps/dns-txt-checker': '/apps/dns-checker', '/pf-weather-now': '/apps/weather-now', '/pf-crypto-track': '/apps/crypto-track' }

/** One app identity and one line of purpose, shared by public and account tools. */
export function AppHeading() {
  const { pathname } = useLocation()
  const app = getAllApps().find((item) => item.route === (aliases[pathname] || pathname))
  if (!app) return null
  const Icon = app.id === 'ai-dragon-arena' ? DragonArenaIcon : icons[app.icon as keyof typeof icons] || Wrench
  return <Heading className="app-heading w-full" title={app.name} description={app.description} icon={<Icon />} />
}
