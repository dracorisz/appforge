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

const normalizations = new Map([
  ['self-end bg-primary px-4 font-semibold text-primary-foreground', { className: 'self-end', sizeMd: true }],
  ['self-end px-4 font-semibold', { className: 'self-end', sizeMd: true }],
  ['cursor-not-allowed px-4 font-semibold opacity-50', { className: null, sizeMd: true }],
  ['w-full px-4 font-semibold', { className: 'w-full', sizeMd: true }],
  ['col-span-2 px-4', { className: 'col-span-2', sizeMd: true }],
  ['flex-1 py-2 font-semibold', { className: 'flex-1', sizeMd: false }],
  ['flex w-full font-semibold', { className: 'w-full', sizeMd: false }],
  ['grid place-items-center font-semibold', { className: 'grid place-items-center', sizeMd: false }],
  ['bg-primary px-4 py-2 font-semibold text-primary-foreground', { className: null, sizeMd: true }],
  ['bg-primary px-4 font-semibold text-primary-foreground', { className: null, sizeMd: true }],
  ['bg-background px-4 font-semibold', { className: null, sizeMd: true }],
  ['px-4 py-2 hover:bg-muted', { className: null, sizeMd: true }],
  ['font-semibold disabled:opacity-40', { className: null, sizeMd: false }],
  ['px-4 py-2 font-semibold', { className: null, sizeMd: true }],
  ['px-4 font-semibold', { className: null, sizeMd: true }],
  ['px-4 capitalize', { className: 'capitalize', sizeMd: true }],
  ['px-4 py-2', { className: null, sizeMd: true }],
  ['font-semibold', { className: null, sizeMd: false }],
  ['py-2', { className: null, sizeMd: false }],
  ['px-4', { className: null, sizeMd: true }],
])

const staticClassValue = (attribute) => {
  if (!attribute.initializer) return null
  if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer.text
  if (ts.isJsxExpression(attribute.initializer) && attribute.initializer.expression && ts.isStringLiteralLike(attribute.initializer.expression)) {
    return attribute.initializer.expression.text
  }
  return null
}

let changedFiles = 0
let normalizedButtons = 0

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8')
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const edits = []

  const visit = (node) => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(sourceFile) === 'Button') {
      const properties = node.attributes.properties
      const classAttribute = properties.find((property) => ts.isJsxAttribute(property) && property.name.getText(sourceFile) === 'className')
      if (classAttribute && ts.isJsxAttribute(classAttribute)) {
        const classValue = staticClassValue(classAttribute)
        const normalization = classValue === null ? null : normalizations.get(classValue)
        if (normalization) {
          const sizeAttribute = properties.find((property) => ts.isJsxAttribute(property) && property.name.getText(sourceFile) === 'size')
          if (normalization.sizeMd && sizeAttribute && ts.isJsxAttribute(sizeAttribute)) {
            edits.push({ start: sizeAttribute.getStart(sourceFile), end: sizeAttribute.getEnd(), text: 'size="md"' })
          }

          let replacement = normalization.className ? `className="${normalization.className}"` : ''
          if (normalization.sizeMd && !sizeAttribute) {
            replacement = `${replacement ? 'size="md" ' : 'size="md"'}${replacement}`
          }
          let start = classAttribute.getStart(sourceFile)
          if (!replacement) while (start > 0 && /[ \t]/.test(source[start - 1])) start -= 1
          edits.push({ start, end: classAttribute.getEnd(), text: replacement })
          normalizedButtons += 1
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  if (!edits.length) continue
  edits.sort((a, b) => b.start - a.start)
  let next = source
  for (const edit of edits) next = next.slice(0, edit.start) + edit.text + next.slice(edit.end)
  if (next !== source) {
    fs.writeFileSync(file, next)
    changedFiles += 1
  }
}

console.log(`Button normalization changed ${changedFiles} files and ${normalizedButtons} Button overrides.`)
