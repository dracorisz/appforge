import type { MiniApp } from '@/types'

type LegacyMiniApp = MiniApp & {
  price?: unknown
  channels?: unknown
}

/**
 * The old workspace model carried one-off sale prices and payment channels.
 * Those fields are no longer product metadata. Strip them at the workspace
 * boundary so fresh state, imported legacy state, and persisted state converge
 * on the current AppForge model without exposing obsolete commerce data.
 */
export function stripLegacyMiniAppCommerce(apps: MiniApp[]): MiniApp[] {
  return apps.map((app) => {
    const { price: _price, channels: _channels, ...current } = app as LegacyMiniApp
    return current as MiniApp
  })
}
