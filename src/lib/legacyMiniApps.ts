import type { MiniApp } from '@/types'

type LegacyMiniApp = MiniApp & {
  price?: unknown
  channels?: unknown
}

const RETIRED_PLACEHOLDER_IDS = new Set([
  'mini-1', // Resume Forge
  'mini-2', // Pitch Deck
  'mini-3', // Invoice Studio
  'mini-5', // Source Grade
  'mini-9', // Link Checker
  'mini-21', // Markdown Previewer
  'mini-23', // Audio Converter
  'mini-24', // PDF Tool
  'mini-25', // Excel Tool
  'mini-26', // SVG Tool
])

/**
 * Normalize old workspace state before it reaches the current product. Legacy
 * commerce fields and unfinished placeholder apps are intentionally discarded,
 * including from persisted/imported workspaces.
 */
export function stripLegacyMiniAppCommerce(apps: MiniApp[]): MiniApp[] {
  return apps
    .filter((app) => !RETIRED_PLACEHOLDER_IDS.has(app.id))
    .map((app) => {
      const { price: _price, channels: _channels, ...current } = app as LegacyMiniApp
      return current as MiniApp
    })
}
