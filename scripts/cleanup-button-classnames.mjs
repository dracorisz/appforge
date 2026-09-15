import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

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

const baseTokens = new Set([
  'inline-flex', 'shrink-0', 'cursor-pointer', 'items-center', 'justify-center', 'gap-2',
  'rounded-xl', 'border', 'text-sm', 'font-medium', 'duration-150',
  'focus-visible:outline-none', 'focus-visible:ring-0', 'focus-visible:ring-ring/35',
  'focus-visible:ring-offset-2', 'focus-visible:ring-offset-background',
  'disabled:pointer-events-none', 'disabled:opacity-50',
  '[&>svg]:h-4', '[&>svg]:w-4', '[&>svg]:shrink-0',
])
const variantTokens = {
  primary: new Set(['border-border', 'bg-secondary', 'text-foreground', 'hover:border-ring/20', 'hover:bg-accent']),
  default: new Set(['border-border', 'bg-secondary', 'text-foreground', 'hover:border-ring/20', 'hover:bg-accent']),
  secondary: new Set(['border-border', 'bg-secondary', 'text-secondary-foreground', 'hover:border-ring/20', 'hover:bg-accent']),
  ghost: new Set(['border-transparent', 'bg-transparent', 'text-foreground', 'hover:border-border', 'hover:bg-accent', 'hover:text-accent-foreground']),
  destructive: new Set(['border-destructive', 'bg-destructive', 'text-destructive-foreground', 'hover:bg-destructive/90']),
}
const sizeTokens = {
  sm: new Set(['h-9', 'min-h-9', 'max-h-9', 'px-2']),
  md: new Set(['h-9', 'min-h-9', 'max-h-9', 'px-4']),
  lg: new Set(['h-9', 'min-h-9', 'max-h-9', 'px-8']),
}

const readStaticProp = (node, name, fallback) => {
  const attr = node.attributes.properties.find((property) => ts.isJsxAttribute(property) && property.name.getText() === name)
  if (!attr || !ts.isJsxAttribute(attr) || !attr.initializer) return fallback
  if (ts.isStringLiteral(attr.initializer)) return attr.initializer.text
  if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression && ts.isStringLiteralLike(attr.initializer.expression)) return attr.initializer.expression.text
  return fallback
}

let changedFiles = 0
let cleanedAttributes = 0
let removedAttributes = 0

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const edits = []
  const visit = (node) => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(sourceFile) === 'Button') {
      const variant = readStaticProp(node, 'variant', 'primary')
      const size = readStaticProp(node, 'size', 'sm')
      const redundant = new Set([...baseTokens, ...(variantTokens[variant] || []), ...(sizeTokens[size] || [])])
      for (const property of node.attributes.properties) {
        if (!ts.isJsxAttribute(property) || property.name.getText(sourceFile) !== 'className' || !property.initializer) continue
        let value = null
        let wrapper = 'quote'
        if (ts.isStringLiteral(property.initializer)) value = property.initializer.text
        else if (ts.isJsxExpression(property.initializer) && property.initializer.expression && ts.isStringLiteralLike(property.initializer.expression)) {
          value = property.initializer.expression.text
          wrapper = 'expr'
        }
        if (value === null) continue
        const tokens = value.split(/\s+/).filter(Boolean)
        const nextTokens = tokens.filter((token) => !redundant.has(token) && token !== 'transition-colors')
        if (nextTokens.length === tokens.length) continue
        cleanedAttributes += 1
        if (!nextTokens.length) {
          let start = property.getStart(sourceFile)
          while (start > 0 && /[ \t]/.test(source[start - 1])) start -= 1
          edits.push({ start, end: property.getEnd(), text: '' })
          removedAttributes += 1
        } else {
          const text = nextTokens.join(' ')
          const replacement = wrapper === 'expr' ? `className={"${text}"}` : `className="${text}"`
          edits.push({ start: property.getStart(sourceFile), end: property.getEnd(), text: replacement })
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  if (!edits.length) continue
  let next = source
  edits.sort((a, b) => b.start - a.start)
  for (const edit of edits) next = next.slice(0, edit.start) + edit.text + next.slice(edit.end)
  if (next !== source) {
    fs.writeFileSync(file, next)
    changedFiles += 1
  }
}

console.log(`Button cleanup changed ${changedFiles} files, cleaned ${cleanedAttributes} className attributes, removed ${removedAttributes} empty className attributes.`)
