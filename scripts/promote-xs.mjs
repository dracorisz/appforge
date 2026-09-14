import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('src')
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.css'])
const findings = []

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (extensions.has(path.extname(entry.name))) {
      const source = fs.readFileSync(full, 'utf8')
      const count = source.match(/text-xs/g)?.length || 0
      if (count) findings.push({ file: path.relative(process.cwd(), full).replaceAll('\\', '/'), count })
    }
  }
}

walk(root)
const total = findings.reduce((sum, item) => sum + item.count, 0)
console.log(`text-xs audit: ${total} occurrence${total === 1 ? '' : 's'} across ${findings.length} file${findings.length === 1 ? '' : 's'}.`)
for (const item of findings.sort((a, b) => b.count - a.count || a.file.localeCompare(b.file))) console.log(`${item.count}× ${item.file}`)

if (process.argv.includes('--check') && total > 0) process.exit(1)
