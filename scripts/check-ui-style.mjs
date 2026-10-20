import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('src')
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.css'])
const files = []

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (extensions.has(path.extname(entry.name))) files.push(full)
  }
}
walk(root)

const radius = /(?:^|[\s"'`{}])((?:[a-z-]+:)*rounded-[^\s"'`}>]+)/g
const shadow = /(?:^|[\s"'`{}])((?:[a-z-]+:)*shadow(?:-[^\s"'`}>]+)?)/g
const fontSize = /(?:^|[\s"'`{}])((?:[a-z-]+:)*text-(?:xs|sm|base|lg|xl|[2-9]xl|\[-?\d+(?:\.\d+)?(?:px|rem|em)\]))(?=$|[\s"'`{}])/g
const spacing = /(?:^|[\s"'`{}])((?:[a-z-]+:)*-?(?:m[trblxy]?|p[trblxy]?|space-[xy]|gap(?:-[xy])?)-(?:\[[^\]]+\]|\d+(?:\.5)?))(?=$|[\s"'`{}])/g
const ringWidth = /(?:^|[\s"'`{}])((?:[a-z-]+:)*ring-(?:0|1|2|4|8))(?=$|[\s"'`{}])/g
const fontWeight = /(?:^|[\s"'`{}])((?:[a-z-]+:)*font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black))(?=$|[\s"'`{}])/g
const lineHeight = /(?:^|[\s"'`{}])((?:[a-z-]+:)*leading-(?:none|tight|snug|normal|relaxed|loose|\d+|\[[^\]]+\]))(?=$|[\s"'`{}])/g
const paletteUtility = /(?:^|[\s"'`{}])((?:[a-z-]+:)*(?:text|bg|border|ring|from|via|to|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:\/\d+|-[0-9]{2,3}(?:\/\d+)?)?)(?=$|[\s"'`{}])/g

const violations = []
const allowedFontSizes = new Set(['text-5xl', 'text-lg', 'text-sm'])
const allowedSpacing = new Set(['2', '4', '8'])
const allowedWeights = new Set(['font-normal', 'font-medium', 'font-semibold'])
const fontUsage = new Map([...allowedFontSizes, 'text-xs'].map((size) => [size, 0]))
const utilityPart = (token) => token.slice(token.lastIndexOf(':') + 1)
const relative = (file) => path.relative(process.cwd(), file).replaceAll('\\', '/')
const approvedSpacingByFile = new Map([
  ['src/components/layout/ProjectPulse.tsx', new Set(['px-0'])],
  ['src/components/layout/Sidebar.tsx', new Set(['space-y-1'])],
  ['src/components/resources/Settings.tsx', new Set(['gap-1'])],
  ['src/components/resources/People.tsx', new Set(['p-0'])],
  ['src/components/public/HuggingFaceGalleryPage.tsx', new Set(['p-0'])],
])
const approvedSpacing = (filePath, utility) => utility === 'mt-1' || approvedSpacingByFile.get(filePath)?.has(utility)

const diagnostics = {
  rawControls: new Map(),
  surfaces: new Map(),
}
const bump = (map, file, amount = 1) => map.set(file, (map.get(file) || 0) + amount)

for (const file of files) {
  const filePath = relative(file)
  const source = fs.readFileSync(file, 'utf8')
  const lines = source.split(/\r?\n/)
  lines.forEach((line, index) => {
    for (const match of line.matchAll(radius)) {
      const token = match[1]
      if (utilityPart(token) !== 'rounded-xl') violations.push(`${filePath}:${index + 1}: forbidden radius ${token}`)
    }
    for (const match of line.matchAll(shadow)) {
      const token = match[1]
      if (utilityPart(token) !== 'shadow-xl') violations.push(`${filePath}:${index + 1}: forbidden shadow ${token}`)
    }
    for (const match of line.matchAll(fontSize)) {
      const token = match[1]
      const utility = utilityPart(token)
      fontUsage.set(utility, (fontUsage.get(utility) || 0) + 1)
      if (utility === 'text-xs') {
        const hasDesignException = lines.slice(index, index + 3).some((candidate) => candidate.includes('design-xs-ok'))
        const compactSidebarModeButton = filePath === 'src/components/layout/Sidebar.tsx' && line.includes('!min-h-6') && line.includes('!h-6')
        if (!hasDesignException && !compactSidebarModeButton) violations.push(`${filePath}:${index + 1}: text-xs requires an explicit design-xs-ok exception`)
      } else if (!allowedFontSizes.has(utility)) {
        violations.push(`${filePath}:${index + 1}: noncanonical font size ${token}`)
      }
    }
    for (const match of line.matchAll(spacing)) {
      const token = match[1]
      const utility = utilityPart(token).replace(/^-/, '')
      const value = utility.slice(utility.lastIndexOf('-') + 1)
      if (!allowedSpacing.has(value) && !approvedSpacing(filePath, utility)) violations.push(`${filePath}:${index + 1}: noncanonical spacing ${token}`)
    }
    for (const match of line.matchAll(ringWidth)) {
      const token = match[1]
      if (utilityPart(token) !== 'ring-0') violations.push(`${filePath}:${index + 1}: forbidden ring width ${token}`)
    }
    for (const match of line.matchAll(fontWeight)) {
      const token = match[1]
      if (!allowedWeights.has(utilityPart(token))) violations.push(`${filePath}:${index + 1}: noncanonical font weight ${token}`)
    }
    for (const match of line.matchAll(lineHeight)) {
      if (!line.includes('design-leading-ok')) violations.push(`${filePath}:${index + 1}: page-local line height ${match[1]} requires design-leading-ok`)
    }
    for (const match of line.matchAll(paletteUtility)) {
      const approvedGoogleBrandFallback = filePath === 'src/auth/LoginPage.tsx' && line.includes('bg-black') && line.includes('border-white/30')
      if (!line.includes('design-palette-ok') && !approvedGoogleBrandFallback) violations.push(`${filePath}:${index + 1}: hard-coded palette utility ${match[1]}`)
    }
  })

  if (!filePath.startsWith('src/components/ui/')) {
    const rawControls = source.match(/<(?:button|input|select|textarea)\b/g)?.length || 0
    if (rawControls) bump(diagnostics.rawControls, filePath, rawControls)
    const handmadeSurfaces = source.match(/rounded-xl[^"'`\n]{0,120}\bborder\b[^"'`\n]{0,120}\b(?:bg-card|bg-background|surface-card|surface-panel|surface-muted|surface-popover)\b/g)?.length || 0
    if (handmadeSurfaces) bump(diagnostics.surfaces, filePath, handmadeSurfaces)
  }
}

const formatTop = (map, limit = 20) => [...map.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, limit)
  .map(([file, count]) => `${count}× ${file}`)

const rawControlCount = [...diagnostics.rawControls.values()].reduce((a, b) => a + b, 0)
const surfaceCount = [...diagnostics.surfaces.values()].reduce((a, b) => a + b, 0)
const rawControlBudget = 0
const surfaceBudget = 135
if (rawControlCount > rawControlBudget) violations.push(`raw native control budget exceeded: ${rawControlCount} > ${rawControlBudget}`)
if (surfaceCount > surfaceBudget) violations.push(`hand-built surface budget exceeded: ${surfaceCount} > ${surfaceBudget}`)

console.log(`Typography distribution: ${[...fontUsage.entries()].map(([size, count]) => `${size}=${count}`).join(', ')}`)
console.log(`Structural migration inventory: raw-controls=${rawControlCount}/${rawControlBudget}, hand-built-surfaces=${surfaceCount}/${surfaceBudget}.`)
for (const [label, map] of [
  ['raw native control hotspots', diagnostics.rawControls],
  ['hand-built surface hotspots', diagnostics.surfaces],
]) {
  const top = formatTop(map)
  if (top.length) console.log(`\n${label}:\n${top.join('\n')}`)
}

if (violations.length) {
  console.error(`\nUI style contract failed with ${violations.length} violation${violations.length === 1 ? '' : 's'}:`)
  console.error(violations.slice(0, 300).join('\n'))
  if (violations.length > 300) console.error(`… ${violations.length - 300} additional violations omitted from log.`)
  process.exit(1)
}

console.log(`\nUI style contract OK across ${files.length} source files: canonical defaults plus explicitly reviewed mt-1 and file-scoped spacing exceptions; text-xs only by explicit exception; rounded-xl; shadow-xl; ring-0; semantic palette only.`)