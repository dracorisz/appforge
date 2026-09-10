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

for (const app of apps) {
  if (!categories.has(app.category)) errors.push(`${app.id}: unknown category ${app.category}`)
  if (!validStatuses.has(app.status)) errors.push(`${app.id}: invalid status ${app.status}`)
  if (!semver.test(app.version)) errors.push(`${app.id}: version is not x.y.z (${app.version})`)
  if (!app.route.startsWith('/')) errors.push(`${app.id}: route must start with / (${app.route})`)
  if (!app.name.trim()) errors.push(`${app.id}: missing name`)
  if (!app.description.trim()) errors.push(`${app.id}: missing description`)

  const explicitRoute = appSource.includes(`path=\"${app.route}\"`) || appSource.includes(`path={'${app.route}'}`)
  const sharedSlugRoute = app.route.startsWith('/apps/') && appSource.includes(`path={\`/apps/\${slug}\`}`)
  const plannedFallback = app.route.startsWith('/apps/') && appSource.includes('path="/apps/:slug"')
  const dashboardRoute = ['/marketing'].includes(app.route) && explicitRoute

  if (!explicitRoute && !sharedSlugRoute && !plannedFallback && !dashboardRoute) {
    errors.push(`${app.id}: no intentional router coverage found for ${app.route}`)
  }

  if (app.status === 'idea' && explicitRoute) warnings.push(`${app.id}: idea status has an explicit implementation route; confirm maturity is intentional`)
}

if (!apps.length) errors.push('No apps parsed from src/lib/registry.ts')

console.log(`AppForge app integrity audit: ${apps.length} registry entries across ${categories.size} categories.`)
console.log(`Statuses: ${[...validStatuses].map((status) => `${status}=${apps.filter((app) => app.status === status).length}`).join(', ')}`)

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
