import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const write = (file, content) => fs.writeFileSync(path.join(root, file), content)
const replaceOnce = (source, from, to, label) => {
  if (!source.includes(from)) throw new Error(`Missing expected source for ${label}`)
  return source.replace(from, to)
}

// Shared component geometry: one 36px control height, centralized line-height and border treatment.
write('src/components/ui/controlStyles.ts', `export const controlClass =
  "app-control h-9 min-h-9 max-h-9 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow,background-color] hover:border-foreground/30 focus:border-ring/50 focus:outline-none focus:ring-1 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50";

export const controlLabelClass = "mb-2 block text-sm font-medium text-foreground";
`)

write('src/components/ui/Button.tsx', `import React from 'react'
import { buttonBaseClass, buttonSizeClasses, buttonVariantClasses, type ButtonSize, type ButtonVariant } from './buttonStyles'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  children,
  variant = 'primary',
  size = 'sm',
  className = '',
  type = 'button',
  ...props
}, ref) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={\`${'${buttonBaseClass} ${buttonVariantClasses[variant]} ${buttonSizeClasses[size]} ${className}'}\`}
    >
      {children}
    </button>
  )
})
`)

write('src/components/ui/Inputs.tsx', `import React from "react";
import { Search, X } from "lucide-react";
import { controlClass, controlLabelClass } from "./controlStyles";
import { IconButton } from "./IconButton";

const plainInputTypes = new Set(["checkbox", "radio", "range", "file", "color", "hidden"]);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string }>(function Input({ label, className = "", type = "text", ...props }, ref) {
  const input = <input ref={ref} type={type} {...props} className={\`${'${plainInputTypes.has(String(type)) ? "" : controlClass} ${className}'}\`.trim()} />;
  if (!label) return input;
  return <div className="w-full"><label className={controlLabelClass}>{label}</label>{input}</div>;
});

export function SearchInput({ value, onChange, onClear, placeholder = "Search…", className = "", ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & { value: string; onChange: (event: React.ChangeEvent<HTMLInputElement>) => void; onClear?: () => void }) {
  return <div className={\`relative w-full ${'${className}'}\`}><Search className="pointer-events-none absolute left-2 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><input {...props} type="search" value={value} onChange={onChange} placeholder={placeholder} className={\`${'${controlClass}'} pl-8 pr-8 [&::-webkit-search-cancel-button]:hidden\`} />{value && onClear && <IconButton label="Clear search" icon={<X />} onClick={onClear} className="absolute right-2 top-1/2 z-10 -translate-y-1/2" />}</div>;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }>(function Textarea({ label, className = "", ...props }, ref) {
  const textarea = <textarea ref={ref} {...props} className={\`${'${controlClass}'} min-h-24 max-h-28 resize-y ${'${className}'}\`} />;
  if (!label) return textarea;
  return <div className="w-full"><label className={controlLabelClass}>{label}</label>{textarea}</div>;
});
`)

write('src/components/ui/Select.tsx', `import React from 'react'
import { controlClass, controlLabelClass } from './controlStyles'

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }>(function Select({ label, children, className = '', ...props }, ref) {
  const select = <select ref={ref} {...props} className={\`${'${controlClass} ${className}'}\`}>{children}</select>
  if (!label) return select
  return <div className="w-full"><label className={controlLabelClass}>{label}</label>{select}</div>
})
`)

let badge = read('src/components/ui/Badge.tsx')
badge = badge.replace('inline-flex h-9 items-center', 'inline-flex h-9 max-h-9 items-center')
write('src/components/ui/Badge.tsx', badge)

let css = read('src/index.css')
css = replaceOnce(css, '        --radius: 0.75rem;\n', '        --radius: 0.75rem;\n        --control-height: 2.25rem;\n        --control-line-height: 1.25rem;\n        --border-opacity: 0.92;\n        --surface-border-opacity: 0.88;\n        --shadow-xl: 0 18px 45px hsl(var(--glass-shadow) / 0.18);\n', 'root design tokens')
css = css.replace('border: 1px solid hsl(var(--input) / 0.8);', 'border: 1px solid hsl(var(--input) / var(--border-opacity));')
css = css.replace('min-height: 2.5rem;\n        border:', 'height: var(--control-height);\n        min-height: var(--control-height);\n        max-height: var(--control-height);\n        border:')
css = css.replace('padding: 0.5rem 1rem;\n        font-size: 0.875rem;\n        line-height: 1.5rem;', 'padding: 0 1rem;\n        font-size: 0.875rem;\n        line-height: var(--control-line-height);')
css = css.replace('        border: 1px solid hsl(var(--border) / 0.78);', '        border: 1px solid hsl(var(--border) / var(--surface-border-opacity));')
css = css.replace('        box-shadow: 0 18px 45px hsl(var(--glass-shadow) / 0.18);', '        box-shadow: var(--shadow-xl);')
css = css.replace('    textarea {\n        min-height: 2.5rem;\n        max-height: 7rem;', '    textarea {\n        height: auto;\n        min-height: 6rem;\n        max-height: 7rem;')
css = css.replace('@layer components {', '@layer components {\n    .app-control {\n        line-height: var(--control-line-height);\n    }')
write('src/index.css', css)

let tw = read('tailwind.config.js')
tw = replaceOnce(tw, "      borderRadius: {\n        xl: 'var(--radius)',\n      },", "      borderRadius: {\n        xl: 'var(--radius)',\n      },\n      spacing: {\n        9: 'var(--control-height)',\n      },\n      boxShadow: {\n        xl: 'var(--shadow-xl)',\n      },", 'Tailwind design tokens')
write('tailwind.config.js', tw)

// Media Vault: managed folders are read-only from the upload UI and handler.
let vault = read('src/components/dashboard/PF_UserMediaVault.tsx')
vault = replaceOnce(vault, '  const [preview, setPreview] = React.useState<{ item: VaultMedia; url: string; fallbacks: string[] } | null>(null);', '  const [preview, setPreview] = React.useState<{ item: VaultMedia; url: string; fallbacks: string[] } | null>(null);\n  const uploadInputRef = React.useRef<HTMLInputElement | null>(null);', 'Media Vault upload ref')
vault = replaceOnce(vault, '  const uploadTarget = folder !== "all" && folder !== "dragon-arena" && folder !== "getter-pro" ? folder : "general";', '  const uploadsRestricted = folder === "desktop-buddies" || folder === "Screenshots";\n  const uploadTarget = !uploadsRestricted && folder !== "all" && folder !== "dragon-arena" && folder !== "getter-pro" ? folder : "general";', 'Media Vault restricted folders')
vault = replaceOnce(vault, '    if (!files.length) return;\n    setUploading(true);', '    if (!files.length) return;\n    if (uploadsRestricted) {\n      setError("Uploads are disabled in this managed folder.");\n      return;\n    }\n    setUploading(true);', 'Media Vault upload guard')
const oldUpload = `            <input type="file" multiple accept="image/*,video/*,audio/*,application/pdf,.txt,.md,.json" className="hidden" onChange={handleUpload} disabled={uploading} id="vault-upload" />\n            <label htmlFor="vault-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border/70 bg-background/45 px-4 py-2 text-sm font-medium hover:bg-accent">\n              <Upload className="h-4 w-4" />\n              {uploading ? "Uploading…" : \`Upload to ${'${uploadTarget === "general" ? "General" : uploadTarget}'}\`}\n            </label>`
const newUpload = `            {uploadsRestricted ? (\n              <Badge color="slate">Managed folder · uploads disabled</Badge>\n            ) : (\n              <>\n                <Input ref={uploadInputRef} type="file" multiple accept="image/*,video/*,audio/*,application/pdf,.txt,.md,.json" className="hidden" onChange={handleUpload} disabled={uploading} />\n                <Button variant="secondary" onClick={() => uploadInputRef.current?.click()} disabled={uploading}>\n                  <Upload className="h-4 w-4" />\n                  {uploading ? "Uploading…" : \`Upload to ${'${uploadTarget === "general" ? "General" : uploadTarget}'}\`}\n                </Button>\n              </>\n            )}`
vault = replaceOnce(vault, oldUpload, newUpload, 'Media Vault upload UI')
write('src/components/dashboard/PF_UserMediaVault.tsx', vault)

// Folded sidebar: expand the rail itself on hover so the vertical scroller remains usable.
let sidebar = read('src/components/layout/Sidebar.tsx')
sidebar = sidebar.replace('const collapsedNavClass = "group relative z-20 w-10 overflow-visible hover:z-50 hover:w-56 hover:border hover:border-border/70 hover:bg-background hover:shadow-xl";', 'const collapsedNavClass = "w-full justify-center px-2 group-hover/sidebar:justify-start group-hover/sidebar:px-4";')
sidebar = sidebar.replace('const collapsedLabelClass = "pointer-events-none hidden whitespace-nowrap pr-4 text-sm font-medium group-hover:block";', 'const collapsedLabelClass = "pointer-events-none hidden whitespace-nowrap pr-4 text-sm font-medium group-hover/sidebar:block";')
sidebar = sidebar.replace('const asideWidth = onClose ? "w-screen max-w-none border-r-0" : isCollapsed ? "w-16 border-r border-border" : "w-64 border-r border-border";', 'const asideWidth = onClose ? "w-screen max-w-none border-r-0" : isCollapsed ? "w-16 border-r border-border hover:w-64" : "w-64 border-r border-border";')
sidebar = sidebar.replace('<aside className={`relative z-40 flex h-full flex-col overflow-visible', '<aside className={`group/sidebar relative z-40 flex h-full flex-col overflow-visible')
sidebar = sidebar.replace('<nav className={`scrollbar-hide flex-1 px-4 py-2 ${isCollapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden"}`}>', '<nav className={`scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-2 ${isCollapsed ? "px-2" : "px-4"}`}>')
sidebar = sidebar.replaceAll('space-y-1', 'space-y-2').replaceAll('px-0 ', '')
write('src/components/layout/Sidebar.tsx', sidebar)

// Normalize accidental text-xs drift from the manual update while retaining copy/layout behavior.
const sourceRoot = path.join(root, 'src')
const sourceFiles = []
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(tsx|jsx)$/.test(entry.name)) sourceFiles.push(full)
  }
}
walk(sourceRoot)
for (const file of sourceFiles) {
  let source = fs.readFileSync(file, 'utf8')
  if (source.includes('text-xs')) {
    source = source.replaceAll('text-xs', 'text-sm')
    fs.writeFileSync(file, source)
  }
}

const uiNames = new Set(['Button', 'Input', 'Select', 'Textarea', 'Badge'])
const intrinsicMap = new Map([['button', 'Button'], ['input', 'Input'], ['select', 'Select'], ['textarea', 'Textarea']])

const addUiImports = (source, sourceFile, needed) => {
  if (!needed.size) return source
  const uiImport = sourceFile.statements.find((statement) => ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text === '@/components/ui')
  if (uiImport && uiImport.importClause?.namedBindings && ts.isNamedImports(uiImport.importClause.namedBindings)) {
    const existing = uiImport.importClause.namedBindings.elements.map((element) => element.name.text)
    const merged = [...new Set([...existing, ...needed])].sort()
    const replacement = `import { ${merged.join(', ')} } from "@/components/ui";`
    return source.slice(0, uiImport.getStart(sourceFile)) + replacement + source.slice(uiImport.getEnd())
  }
  const lastImport = [...sourceFile.statements].filter(ts.isImportDeclaration).at(-1)
  const insertAt = lastImport ? lastImport.getEnd() : 0
  const statement = `\nimport { ${[...needed].sort().join(', ')} } from "@/components/ui";`
  return source.slice(0, insertAt) + statement + source.slice(insertAt)
}

for (const file of sourceFiles) {
  if (file.includes(`${path.sep}components${path.sep}ui${path.sep}`)) continue
  let source = fs.readFileSync(file, 'utf8')
  let sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const conflicts = new Set()
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text !== '@/components/ui') {
      const clause = statement.importClause
      if (clause?.name && uiNames.has(clause.name.text)) conflicts.add(clause.name.text)
      if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) for (const item of clause.namedBindings.elements) if (uiNames.has(item.name.text)) conflicts.add(item.name.text)
    }
    if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) && statement.name && uiNames.has(statement.name.text)) conflicts.add(statement.name.text)
    if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name) && uiNames.has(declaration.name.text)) conflicts.add(declaration.name.text)
  }

  const edits = []
  const needed = new Set()
  const visit = (node) => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxClosingElement(node)) && ts.isIdentifier(node.tagName)) {
      const current = node.tagName.text
      const replacement = intrinsicMap.get(current)
      if (replacement && !conflicts.has(replacement)) {
        edits.push({ start: node.tagName.getStart(sourceFile), end: node.tagName.getEnd(), text: replacement })
        needed.add(replacement)
      }
    }
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ts.isIdentifier(node.tagName) && (node.tagName.text === 'span' || node.tagName.text === 'div')) {
      const classAttr = node.attributes.properties.find((prop) => ts.isJsxAttribute(prop) && prop.name.text === 'className')
      const literal = classAttr && classAttr.initializer && ts.isStringLiteral(classAttr.initializer) ? classAttr.initializer.text : ''
      const badgeLike = ['inline-flex', 'items-center', 'rounded-xl', 'border', 'px-2', 'text-sm'].every((token) => literal.includes(token))
      if (badgeLike && !conflicts.has('Badge')) {
        edits.push({ start: node.tagName.getStart(sourceFile), end: node.tagName.getEnd(), text: 'Badge' })
        needed.add('Badge')
        const parent = node.parent
        if (ts.isJsxElement(parent) && ts.isIdentifier(parent.closingElement.tagName) && parent.closingElement.tagName.text === node.tagName.text) {
          edits.push({ start: parent.closingElement.tagName.getStart(sourceFile), end: parent.closingElement.tagName.getEnd(), text: 'Badge' })
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  if (!edits.length) continue
  edits.sort((a, b) => b.start - a.start)
  for (const edit of edits) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end)
  sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  source = addUiImports(source, sourceFile, needed)
  fs.writeFileSync(file, source)
}

let checker = read('scripts/check-ui-style.mjs')
checker = checker.replace('const rawControlBudget = 250', 'const rawControlBudget = 0')
checker = checker.replace('if (rawControlCount > rawControlBudget)', 'if (rawControlCount > rawControlBudget)')
checker = checker.replace('Structural migration inventory: raw-controls=${rawControlCount}/${rawControlBudget}', 'Structural migration inventory: raw-controls=${rawControlCount}/${rawControlBudget}')
write('scripts/check-ui-style.mjs', checker)

let docs = read('docs/DESIGN_SYSTEM.md')
if (!docs.includes('Control height token')) docs += `\n\n## Central theme controls\n\nCore geometry is centralized in \`src/index.css\` and mapped through \`tailwind.config.js\`. \`--radius\` controls \`rounded-xl\`; \`--control-height\` controls the shared \`h-9\` scale; \`--border-opacity\` and \`--surface-border-opacity\` control structural border prominence; \`--shadow-xl\` controls the sole project shadow. Shared Button, Input, Select, Textarea and Badge primitives consume these values. New page-level native button/input/select/textarea elements are not permitted.\n`
write('docs/DESIGN_SYSTEM.md', docs)

console.log('Applied centralized design tokens, Media Vault restrictions, folded Sidebar refinement, and native-control migration.')
