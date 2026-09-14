import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('src')
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx'])
const write = process.argv.includes('--write')
const files = []

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (extensions.has(path.extname(entry.name))) files.push(full)
  }
}
walk(root)

const spacingValue = (raw) => {
  const value = Number(raw)
  if (!Number.isFinite(value)) return raw
  if (value <= 2.5) return '2'
  if (value <= 6) return '4'
  return '8'
}

const fontValue = (utility) => {
  if (utility === 'text-base') return 'text-sm'
  if (utility === 'text-xl' || utility === 'text-2xl' || utility === 'text-3xl' || utility === 'text-4xl') return 'text-lg'
  if (/^text-[6-9]xl$/.test(utility)) return 'text-5xl'
  const arbitrary = utility.match(/^text-\[(-?\d+(?:\.\d+)?)(px|rem|em)\]$/)
  if (!arbitrary) return utility
  const numeric = Number(arbitrary[1]) * (arbitrary[2] === 'px' ? 1 : 16)
  if (numeric <= 11) return 'text-xs'
  if (numeric <= 16) return 'text-sm'
  if (numeric < 32) return 'text-lg'
  return 'text-5xl'
}

const spacingPattern = /(^|[\s"'`])((?:[a-z-]+:)*)(-?(?:m[trblxy]?|p[trblxy]?|space-[xy]|gap(?:-[xy])?)-)(\d+(?:\.5)?)(?=$|[\s"'`}])/g
const fontPattern = /(^|[\s"'`])((?:[a-z-]+:)*)(text-(?:base|xl|[2-9]xl|\[-?\d+(?:\.\d+)?(?:px|rem|em)\]))(?=$|[\s"'`}])/g

let changedFiles = 0
let replacements = 0
const changedPaths = []

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  let next = source.replace(spacingPattern, (match, boundary, variants, prefix, value) => {
    const canonical = spacingValue(value)
    if (canonical === value) return match
    replacements += 1
    return `${boundary}${variants}${prefix}${canonical}`
  })
  next = next.replace(fontPattern, (match, boundary, variants, utility) => {
    const canonical = fontValue(utility)
    if (canonical === utility) return match
    replacements += 1
    return `${boundary}${variants}${canonical}`
  })

  if (next !== source) {
    changedFiles += 1
    changedPaths.push(path.relative(process.cwd(), file))
    if (write) fs.writeFileSync(file, next)
  }
}

console.log(`Design normalizer ${write ? 'updated' : 'would update'} ${changedFiles} files with ${replacements} canonical typography/spacing replacements.`)
if (changedPaths.length) console.log(changedPaths.join('\n'))
if (!write && changedFiles) process.exitCode = 1
