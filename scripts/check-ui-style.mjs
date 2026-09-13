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

const radius = /(?:^|[\s"'`])((?:[a-z-]+:)*rounded-[^\s"'`}>]+)/g
const shadow = /(?:^|[\s"'`])((?:[a-z-]+:)*shadow(?:-[^\s"'`}>]+)?)/g
const violations = []

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  lines.forEach((line, index) => {
    for (const match of line.matchAll(radius)) {
      const token = match[1]
      const utility = token.slice(token.lastIndexOf(':') + 1)
      if (utility !== 'rounded-xl') violations.push(`${file}:${index + 1}: forbidden radius ${token}`)
    }
    for (const match of line.matchAll(shadow)) {
      const token = match[1]
      const utility = token.slice(token.lastIndexOf(':') + 1)
      if (utility !== 'shadow-xl') violations.push(`${file}:${index + 1}: forbidden shadow ${token}`)
    }
  })
}

if (violations.length) {
  console.error(violations.join('\n'))
  process.exit(1)
}
console.log(`UI style contract OK across ${files.length} source files: rounded-xl only; shadow-xl only.`)
