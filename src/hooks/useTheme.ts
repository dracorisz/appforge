import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type AccentColor = 'default' | 'rose' | 'orange' | 'green' | 'blue' | 'violet' | 'slate'
export type Radius = 'none' | 'sm' | 'md' | 'lg'

const accentColors: Record<AccentColor, { light: string; dark: string }> = {
  default: { light: '222.2 47.4% 11.2%', dark: '210 40% 98%' },
  rose: { light: '346.8 77.2% 49.8%', dark: '346.8 77.2% 49.8%' },
  orange: { light: '24.6 95% 53.1%', dark: '24.6 95% 53.1%' },
  green: { light: '142.1 76.2% 36.3%', dark: '142.1 76.2% 36.3%' },
  blue: { light: '217.2 91.2% 59.8%', dark: '217.2 91.2% 59.8%' },
  violet: { light: '262.1 83.3% 57.8%', dark: '262.1 83.3% 57.8%' },
  slate: { light: '215.4 16.3% 46.9%', dark: '215.4 16.3% 46.9%' },
}

const radiusMap: Record<Radius, string> = {
  none: '0rem',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>('system')
  const [accent, setAccent] = useState<AccentColor>('default')
  const [radius, setRadius] = useState<Radius>('md')

  useEffect(() => {
    const saved = localStorage.getItem('appforge-theme')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setMode(parsed.mode || 'system')
        setAccent(parsed.accent || 'default')
        setRadius(parsed.radius || 'md')
      } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    root.classList.toggle('dark', isDark)

    const accentData = accentColors[accent]
    root.style.setProperty('--primary', accentData.light)
    root.style.setProperty('--primary-foreground', '210 40% 98%')
    root.style.setProperty('--ring', accentData.light)
    root.style.setProperty('--radius', radiusMap[radius])

    localStorage.setItem('appforge-theme', JSON.stringify({ mode, accent, radius }))
  }, [mode, accent, radius])

  return { mode, setMode, accent, setAccent, radius, setRadius }
}
