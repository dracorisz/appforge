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

const boundary = String.raw`(?:^|[\s"'` + '`' + String.raw`{}])`
const radius = new RegExp(`${boundary}((?:[a-z-]+:)*rounded-[^\\s"'` + '`' + String.raw`}>]+)`, 'g')
const shadow = new RegExp(`${boundary}((?:[a-z-]+:)*shadow(?:-[^\\s"'` + '`' + String.raw`}>]+)?)`, 'g')
const fontSize = new RegExp(`${boundary}((?:[a-z-]+:)*text-(?:xs|sm|base|lg|xl|[2-9]xl|\\[-?\\d+(?:\\.\\d+)?(?:px|rem|em)\\]))(?=$|[\\s"'` + '`' + String.raw`{}])`, 'g')
const spacing = new RegExp(`${boundary}((?:[a-z-]+:)*-?(?:m[trblxy]?|p[trblxy]?|space-[xy]|gap(?:-[xy])?)-(?:\\[[^\\]]+\\]|\\d+(?:\\.5)?))(?=$|[\\s"'` + '`' + String.raw`{}])`, 'g')
const ringWidth = new RegExp(`${boundary}((?:[a-z-]+:)*ring-(?:0|1|2|4|8))(?=$|[\\s"'` + '`' + String.raw`{}])`, 'g')

const violations = []
const allowedFontSizes = new Set(['text-5xl', 'text-lg', 'text-sm', 'text-xs'])
const allowedSpacing = new Set(['2', '4', '8'])
const utilityPart = (token) => token.slice(token.lastIndexOf(':') + 1)

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  lines.forEach((line, index) => {
    for (const match of line.matchAll(radius)) {
      const token = match[1]
      if (utilityPart(token) !== 'rounded-xl') violations.push(`${file}:${index + 1}: forbidden radius ${token}`)
    }
    for (const match of line.matchAll(shadow)) {
      const token = match[1]
      if (utilityPart(token) !== 'shadow-xl') violations.push(`${file}:${index + 1}: forbidden shadow ${token}`)
    }
    for (const match of line.matchAll(fontSize)) {
      const token = match[1]
      if (!allowedFontSizes.has(utilityPart(token))) violations.push(`${file}:${index + 1}: noncanonical font size ${token}`)
    }
    for (const match of line.matchAll(spacing)) {
      const token = match[1]
      const utility = utilityPart(token).replace(/^-/, '')
      const value = utility.slice(utility.lastIndexOf('-') + 1)
      if (!allowedSpacing.has(value)) violations.push(`${file}:${index + 1}: noncanonical spacing ${token}`)
    }
    for (const match of line.matchAll(ringWidth)) {
      const token = match[1]
      if (utilityPart(token) !== 'ring-1') violations.push(`${file}:${index + 1}: forbidden ring width ${token}`)
    }
  })
}

if (violations.length) {
  console.error(`UI style contract failed with ${violations.length} violation${violations.length === 1 ? '' : 's'}:`)
  console.error(violations.slice(0, 300).join('\n'))
  if (violations.length > 300) console.error(`… ${violations.length - 300} additional violations omitted from log.`)
  process.exit(1)
}

console.log(`UI style contract OK across ${files.length} source files: typography text-5xl/text-lg/text-sm/text-xs only; spacing 2/4/8 only; rounded-xl only; shadow-xl only; ring-1 only.`)
