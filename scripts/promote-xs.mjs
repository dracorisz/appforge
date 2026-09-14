import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('src')
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.css'])
let filesChanged = 0
let replacements = 0

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (extensions.has(path.extname(entry.name))) {
      const source = fs.readFileSync(full, 'utf8')
      const matches = source.match(/text-xs/g)
      if (!matches?.length) continue
      const next = source.replace(/text-xs/g, 'text-sm')
      fs.writeFileSync(full, next)
      filesChanged += 1
      replacements += matches.length
    }
  }
}

walk(root)
console.log(`Promoted ${replacements} text-xs utilities to text-sm across ${filesChanged} files.`)
