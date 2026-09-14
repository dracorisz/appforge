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
      changed.push(path.relative(process.cwd(), full).replaceAll('\\', '/'))
      replacements += matches.length
    }
  }
}
walk(root)

if (!changed.length) {
  console.log('No text-xs utilities remain; no normalization commit is needed.')
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
    message: 'style: promote ordinary xs typography project-wide',
    tree: nextTree.sha,
    parents: [parentSha],
  }),
  headers: { 'Content-Type': 'application/json' },
})

console.log(`Normalized ${replacements} text-xs utilities across ${changed.length} files.`)
console.log(`NORMALIZED_COMMIT_SHA=${commit.sha}`)
console.log(`NORMALIZED_TREE_SHA=${nextTree.sha}`)
