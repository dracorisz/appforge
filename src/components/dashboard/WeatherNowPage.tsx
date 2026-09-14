import React from 'react'
import { PF_WeatherNow as WeatherNowDashboard } from './WeatherNow'
import { WidgetPreferencePanel } from './WidgetPreferencePanel'

export function WeatherNowPage() {
  return (
    <div data-weather-now className="w-full space-y-4 pb-8">
      <WidgetPreferencePanel kind="weather" />
      <WeatherNowDashboard />
    </div>
  )
}

export type { WeatherData } from './WeatherNow'
