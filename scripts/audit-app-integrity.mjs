import fs from 'node:fs'

const registrySource = fs.readFileSync(new URL('../src/lib/registry.ts', import.meta.url), 'utf8')
const appSource = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')

const categoryMatches = [...registrySource.matchAll(/\{ id: '([^']+)', name: '[^']+', description: '[^']+', icon: '[^']+', apps: \[\] \}/g)]
const categories = new Set(categoryMatches.map((match) => match[1]))

const appMatches = [...registrySource.matchAll(/app\(\{ id: '([^']+)', name: '([^']+)', description: '([^']*)', category: '([^']+)', icon: '([^']+)', route: '([^']+)', tags: \[([^\]]*)\], status: '([^']+)', version: '([^']+)'/g)]

const apps = appMatches.map((match) => ({
  id: match[1],
  name: match[2],
  description: match[3],
  category: match[4],
  icon: match[5],
  route: match[6],
  status: match[8],
  version: match[9],
}))

const errors = []
const warnings = []
const validStatuses = new Set(['idea', 'building', 'beta', 'launched', 'deprecated'])
const semver = /^\d+\.\d+\.\d+$/

const duplicateValues = (items, key) => {
  const seen = new Map()
  for (const item of items) {
    const value = item[key]
    seen.set(value, [...(seen.get(value) || []), item])
  }
  return [...seen.entries()].filter(([, values]) => values.length > 1)
}

const sharedRouteSlugs = new Set()
for (const match of appSource.matchAll(/\[([^\]]+)\]\.map\(\(slug\) => <Route key=\{slug\} path=\{`\/apps\/\$\{slug\}`\}/g)) {
  for (const slugMatch of match[1].matchAll(/'([^']+)'/g)) sharedRouteSlugs.add(slugMatch[1])
}

const explicitRoutes = new Set()
for (const match of appSource.matchAll(/<Route\s+path="([^"]+)"/g)) explicitRoutes.add(match[1])
for (const match of appSource.matchAll(/<Route\s+path=\{'([^']+)'\}/g)) explicitRoutes.add(match[1])

const hasPlannedFallback = explicitRoutes.has('/apps/:slug')

for (const [id, values] of duplicateValues(apps, 'id')) {
  errors.push(`Duplicate app id: ${id} (${values.map((item) => item.name).join(', ')})`)
}

const allowedRouteAliases = new Map([
  ['/apps/any-converter', new Set(['any-converter', 'data-shortcut'])],
])

for (const [route, values] of duplicateValues(apps, 'route')) {
  const expected = allowedRouteAliases.get(route)
  const ids = new Set(values.map((item) => item.id))
  const matchesExpected = expected && ids.size === expected.size && [...ids].every((id) => expected.has(id))
  if (!matchesExpected) errors.push(`Unexpected duplicate route: ${route} (${values.map((item) => item.id).join(', ')})`)
}

const implementationCounts = { explicit: 0, shared: 0, planned: 0 }

for (const app of apps) {
  if (!categories.has(app.category)) errors.push(`${app.id}: unknown category ${app.category}`)
  if (!validStatuses.has(app.status)) errors.push(`${app.id}: invalid status ${app.status}`)
  if (!semver.test(app.version)) errors.push(`${app.id}: version is not x.y.z (${app.version})`)
  if (!app.route.startsWith('/')) errors.push(`${app.id}: route must start with / (${app.route})`)
  if (!app.name.trim()) errors.push(`${app.id}: missing name`)
  if (!app.description.trim()) errors.push(`${app.id}: missing description`)
  if (!app.icon.trim()) errors.push(`${app.id}: missing icon`)

  const slug = app.route.startsWith('/apps/') ? app.route.slice('/apps/'.length) : null
  const explicitRoute = explicitRoutes.has(app.route)
  const sharedRoute = Boolean(slug && sharedRouteSlugs.has(slug))
  const plannedRoute = Boolean(slug && hasPlannedFallback && app.status === 'idea')

  if (explicitRoute) implementationCounts.explicit += 1
  else if (sharedRoute) implementationCounts.shared += 1
  else if (plannedRoute) implementationCounts.planned += 1
  else errors.push(`${app.id}: ${app.status} app has no proven implementation route for ${app.route}`)

  if (app.status === 'idea' && (explicitRoute || sharedRoute)) {
    warnings.push(`${app.id}: idea status has an implementation route; confirm maturity is intentional`)
  }

  if (app.status !== 'idea' && !explicitRoute && !sharedRoute) {
    errors.push(`${app.id}: ${app.status} apps may not rely on the generic planned-app fallback`)
  }
}

const getter = apps.find((item) => item.id === 'scrapper-pro')
if (!getter) errors.push('Getter Pro compatibility registry entry is missing (expected stable id scrapper-pro)')
else {
  if (getter.name !== 'Getter Pro') errors.push(`scrapper-pro: product-facing name must be Getter Pro (found ${getter.name})`)
  if (getter.route !== '/apps/getter-pro') errors.push(`scrapper-pro: canonical route must be /apps/getter-pro (found ${getter.route})`)
}

const storyStudio = apps.find((item) => item.id === 'ai-dragon-arena')
if (!storyStudio) errors.push('Story Studio registry entry is missing (expected stable id ai-dragon-arena)')
else {
  if (storyStudio.name !== 'Story Studio') errors.push(`ai-dragon-arena: product-facing name must be Story Studio (found ${storyStudio.name})`)
  if (storyStudio.icon !== 'DragonArena') errors.push(`ai-dragon-arena: expected shared joypad icon key DragonArena (found ${storyStudio.icon})`)
}

if (!apps.length) errors.push('No apps parsed from src/lib/registry.ts')

console.log(`AppForge app integrity audit: ${apps.length} registry entries across ${categories.size} categories.`)
console.log(`Statuses: ${[...validStatuses].map((status) => `${status}=${apps.filter((app) => app.status === status).length}`).join(', ')}`)
console.log(`Implementation surfaces: explicit=${implementationCounts.explicit}, shared=${implementationCounts.shared}, planned=${implementationCounts.planned}`)

if (warnings.length) {
  console.log('\nWarnings:')
  for (const warning of warnings) console.log(`- ${warning}`)
}

if (errors.length) {
  console.error('\nIntegrity errors:')
  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
} else {
  console.log('Integrity result: PASS')
}
