import React from 'react'
import { useLocation } from 'react-router-dom'
import { getAllApps } from '@/lib/registry'
import { getAppIconComponent } from '@/lib/appIcons'
import { DragonArenaIcon } from '@/components/dashboard/DragonArenaIcon'
import { Heading } from '@/components/ui'

const aliases: Record<string, string> = { '/apps/any-converter': '/apps/data-converter', '/apps/dns-txt-checker': '/apps/dns-checker', '/pf-weather-now': '/apps/weather-now', '/pf-crypto-track': '/apps/crypto-track' }

/** One app identity and one line of purpose, shared by public and account tools. */
export function AppHeading() {
  const { pathname } = useLocation()
  const app = getAllApps().find((item) => item.route === (aliases[pathname] || pathname))
  if (!app) return null
  const Icon = app.id === 'ai-dragon-arena' ? DragonArenaIcon : getAppIconComponent(app.icon)
  return <Heading className="app-heading w-full" title={app.name} description={app.description} icon={<Icon />} />
}
