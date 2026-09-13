import React from 'react'
import { PF_WeatherNow } from './PF_WeatherNow'
import { WidgetPreferencePanel } from './WidgetPreferencePanel'

export function WeatherNowPage() {
  return (
    <div className="w-full space-y-4 pb-8">
      <WidgetPreferencePanel kind="weather" />
      <PF_WeatherNow />
    </div>
  )
}

export type { WeatherData } from './PF_WeatherNow'
