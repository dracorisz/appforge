import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('src')
const files = []
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith('.tsx')) files.push(full)
  }
}
walk(root)

const replacements = [
  ['className="self-end bg-primary px-4 font-semibold text-primary-foreground"', 'size="md" className="self-end"'],
  ['className="self-end px-4 font-semibold"', 'size="md" className="self-end"'],
  ['className="cursor-not-allowed px-4 font-semibold opacity-50"', 'size="md"'],
  ['className="w-full px-4 font-semibold"', 'size="md" className="w-full"'],
  ['className="col-span-2 px-4"', 'size="md" className="col-span-2"'],
  ['className="flex-1 py-2 font-semibold"', 'className="flex-1"'],
  ['className="flex w-full font-semibold"', 'className="w-full"'],
  ['className="grid place-items-center font-semibold"', 'className="grid place-items-center"'],
  ['className="bg-primary px-4 py-2 font-semibold text-primary-foreground"', 'size="md"'],
  ['className="bg-primary px-4 font-semibold text-primary-foreground"', 'size="md"'],
  ['className="bg-background px-4 font-semibold"', 'size="md"'],
  ['className="px-4 py-2 hover:bg-muted"', 'size="md"'],
  ['className="font-semibold disabled:opacity-40"', ''],
  ['className="px-4 py-2 font-semibold"', 'size="md"'],
  ['className="px-4 font-semibold"', 'size="md"'],
  ['className="px-4 capitalize"', 'size="md" className="capitalize"'],
  ['className="px-4 py-2"', 'size="md"'],
  ['className="font-semibold"', ''],
  ['className="py-2"', ''],
  ['className="px-4"', 'size="md"'],
]

let changedFiles = 0
let replacementCount = 0
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  let next = source
  for (const [from, to] of replacements) {
    if (!next.includes(from)) continue
    const parts = next.split(from)
    replacementCount += parts.length - 1
    next = parts.join(to)
  }
  next = next
    .replace(/size="sm"\s+size="md"/g, 'size="md"')
    .replace(/size="md"\s+size="md"/g, 'size="md"')
    .replace(/\s{2,}>/g, '>')
  if (next === source) continue
  fs.writeFileSync(file, next)
  changedFiles += 1
}

console.log(`Button normalization changed ${changedFiles} files with ${replacementCount} targeted replacements.`)
