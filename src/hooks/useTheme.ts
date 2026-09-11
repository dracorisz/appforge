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

type ThemeSettings = { mode: ThemeMode; accent: AccentColor; radius: Radius }

const readTheme = (): ThemeSettings => {
  try {
    const saved = JSON.parse(localStorage.getItem('appforge-theme') || '{}')
    return {
      mode: saved.mode === 'light' || saved.mode === 'dark' || saved.mode === 'system' ? saved.mode : 'dark',
      accent: Object.prototype.hasOwnProperty.call(accentColors, saved.accent) ? saved.accent : 'default',
      radius: Object.prototype.hasOwnProperty.call(radiusMap, saved.radius) ? saved.radius : 'md',
    }
  } catch {
    return { mode: 'dark', accent: 'default', radius: 'md' }
  }
}

export function useTheme() {
  const [{ mode, accent, radius }, setTheme] = useState<ThemeSettings>(readTheme)

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'appforge-theme' || event.key === null) setTheme(readTheme())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      const isDark = mode === 'dark' || (mode === 'system' && media.matches)
      root.classList.toggle('dark', isDark)
      root.style.colorScheme = isDark ? 'dark' : 'light'

      const accentData = accentColors[accent]
      const primary = isDark ? accentData.dark : accentData.light
      const primaryForeground = accent === 'default' && isDark ? '240 5.9% 10%' : '0 0% 98%'
      root.style.setProperty('--primary', primary)
      root.style.setProperty('--primary-foreground', primaryForeground)
      root.style.setProperty('--ring', primary)
      root.style.setProperty('--radius', radiusMap[radius])
    }

    apply()
    if (mode === 'system') media.addEventListener('change', apply)
    localStorage.setItem('appforge-theme', JSON.stringify({ mode, accent, radius }))
    return () => media.removeEventListener('change', apply)
  }, [mode, accent, radius])

  return {
    mode,
    setMode: (nextMode: ThemeMode) => setTheme((current) => ({ ...current, mode: nextMode })),
    accent,
    setAccent: (nextAccent: AccentColor) => setTheme((current) => ({ ...current, accent: nextAccent })),
    radius,
    setRadius: (nextRadius: Radius) => setTheme((current) => ({ ...current, radius: nextRadius })),
  }
}
