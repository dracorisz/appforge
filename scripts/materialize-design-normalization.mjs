import fs from 'node:fs'
import path from 'node:path'

const token = process.env.GITHUB_TOKEN
const repository = process.env.GITHUB_REPOSITORY
const parentSha = process.env.GITHUB_SHA

if (!token || !repository || !parentSha) {
  throw new Error('GITHUB_TOKEN, GITHUB_REPOSITORY and GITHUB_SHA are required.')
}

const root = path.resolve('src')
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.css'])
const changed = []
const totals = { xs: 0, weights: 0, lineHeights: 0, palette: 0 }

const neutralFamilies = new Set(['slate', 'gray', 'zinc', 'neutral', 'stone'])
const destructiveFamilies = new Set(['red', 'rose'])
const warningFamilies = new Set(['orange', 'amber', 'yellow'])
const successFamilies = new Set(['lime', 'green', 'emerald'])
const infoFamilies = new Set(['teal', 'cyan', 'sky', 'blue'])
const primaryFamilies = new Set(['indigo', 'violet', 'purple', 'fuchsia', 'pink'])
const colorFamilies = [...neutralFamilies, ...destructiveFamilies, ...warningFamilies, ...successFamilies, ...infoFamilies, ...primaryFamilies, 'black', 'white']
const colorUtility = new RegExp(`\\b((?:[a-zA-Z0-9_\\-\\[\\]&]+:)*)((text|bg|border|ring|from|via|to|fill|stroke)-(${colorFamilies.join('|')})(?:-[0-9]{2,3})?(\\/[0-9]{1,3})?)\\b`, 'g')

const semanticColor = (kind, family) => {
  if (neutralFamilies.has(family)) {
    if (kind === 'text' || kind === 'fill' || kind === 'stroke') return 'muted-foreground'
    if (kind === 'border') return 'border'
    if (kind === 'ring') return 'ring'
    return 'muted'
  }
  if (destructiveFamilies.has(family)) return 'destructive'
  if (warningFamilies.has(family)) return 'warning'
  if (successFamilies.has(family)) return 'success'
  if (infoFamilies.has(family)) return 'info'
  if (primaryFamilies.has(family)) return 'primary'
  if (family === 'black') return 'overlay'
  return 'inverse'
}

const normalize = (source) => {
  let next = source
  next = next.replace(/\btext-xs\b/g, () => {
    totals.xs += 1
    return 'text-sm'
  })
  next = next.replace(/\bfont-(?:bold|extrabold|black)\b/g, () => {
    totals.weights += 1
    return 'font-semibold'
  })
  next = next.replace(/\bfont-(?:thin|extralight|light)\b/g, () => {
    totals.weights += 1
    return 'font-normal'
  })
  next = next.replace(/\s+(?:[a-z-]+:)*leading-(?:none|tight|snug|normal|relaxed|loose|\d+|\[[^\]]+\])/g, () => {
    totals.lineHeights += 1
    return ''
  })
  next = next.replace(colorUtility, (_match, variants, _utility, kind, family, opacity = '') => {
    totals.palette += 1
    return `${variants}${kind}-${semanticColor(kind, family)}${opacity}`
  })
  return next
}

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (extensions.has(path.extname(entry.name))) {
      const source = fs.readFileSync(full, 'utf8')
      const next = normalize(source)
      if (next === source) continue
      fs.writeFileSync(full, next)
      changed.push(path.relative(process.cwd(), full).replaceAll('\\', '/'))
    }
  }
}
walk(root)

if (!changed.length) {
  console.log('No design-token normalization changes are needed.')
  process.exit(0)
}

const api = async (endpoint, options = {}) => {
  const response = await fetch(`https://api.github.com/repos/${repository}${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  })
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${endpoint} failed: ${response.status} ${await response.text()}`)
  return response.json()
}

const parent = await api(`/git/commits/${parentSha}`)
const tree = []
for (const file of changed) {
  const blob = await api('/git/blobs', {
    method: 'POST',
    body: JSON.stringify({ content: fs.readFileSync(file, 'utf8'), encoding: 'utf-8' }),
    headers: { 'Content-Type': 'application/json' },
  })
  tree.push({ path: file, mode: '100644', type: 'blob', sha: blob.sha })
}

const nextTree = await api('/git/trees', {
  method: 'POST',
  body: JSON.stringify({ base_tree: parent.tree.sha, tree }),
  headers: { 'Content-Type': 'application/json' },
})
const commit = await api('/git/commits', {
  method: 'POST',
  body: JSON.stringify({
    message: 'style: finish responsive typography normalization',
    tree: nextTree.sha,
    parents: [parentSha],
  }),
  headers: { 'Content-Type': 'application/json' },
})

console.log(`Normalized ${changed.length} source files.`)
console.log(`Design token replacements: xs=${totals.xs}, weights=${totals.weights}, line-heights=${totals.lineHeights}, palette=${totals.palette}.`)
console.log(`NORMALIZED_COMMIT_SHA=${commit.sha}`)
console.log(`NORMALIZED_TREE_SHA=${nextTree.sha}`)
