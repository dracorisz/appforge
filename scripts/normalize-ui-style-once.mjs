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

const tokenReplacements = [
  ['mt-0', ''], ['p-0', ''], ['px-0', ''],
  ['mt-1', 'mt-2'], ['mb-1', 'mb-2'], ['ml-1', 'ml-2'], ['mr-1', 'mr-2'],
  ['gap-1', 'gap-2'], ['gap-x-1', 'gap-x-2'], ['gap-y-1', 'gap-y-2'],
  ['space-y-1', 'space-y-2'], ['space-x-1', 'space-x-2'],
  ['space-y-3', 'space-y-4'], ['space-x-3', 'space-x-4'],
  ['py-3', 'py-4'], ['px-3', 'px-4'], ['p-3', 'p-4'], ['m-3', 'm-4'],
]

const replaceUtility = (source, from, to) => {
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return source.replace(new RegExp(`(?<![A-Za-z0-9_-])${escaped}(?![A-Za-z0-9_.-])`, 'g'), to)
}

let changed = 0
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8')
  let after = before

  for (const [from, to] of tokenReplacements) after = replaceUtility(after, from, to)

  after = after.split(/\r?\n/).map((line) => {
    let next = line
    if (next.includes('text-xs') && !next.includes('design-xs-ok')) next = next.replace(/\btext-xs\b/g, 'text-sm')
    if (!next.includes('design-palette-ok')) {
      next = next
        .replace(/\bbg-black\b/g, 'bg-overlay')
        .replace(/\btext-white\b/g, 'text-inverse')
        .replace(/\bborder-white\/30\b/g, 'border-inverse/30')
    }
    return next.replace(/[ \t]+$/g, '')
  }).join('\n')

  if (before.endsWith('\n') && !after.endsWith('\n')) after += '\n'
  if (after !== before) {
    fs.writeFileSync(file, after)
    changed += 1
    console.log(path.relative(process.cwd(), file))
  }
}

console.log(`Normalized ${changed} source files.`)
