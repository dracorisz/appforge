import React from 'react'
import { PF_WeatherNow } from './PF_WeatherNow'
import { WidgetPreferencePanel } from './WidgetPreferencePanel'

export function WeatherNowPage() {
  return (
    <>
      <WidgetPreferencePanel kind="weather" />
      <PF_WeatherNow />
    </>
  )
}

export type { WeatherData } from './PF_WeatherNow'
