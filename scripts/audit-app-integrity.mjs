import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const read = (filePath) => fs.readFile(path.join(root, filePath), 'utf8')

const registrySource = await read('src/lib/registry.ts')
const appSource = await read('src/App.tsx')
const loginSource = await read('src/auth/LoginPage.tsx')
const companionSource = await read('src/components/dashboard/Companion.tsx')

const failures = []

if (!registrySource.includes("id: 'companion'") || !registrySource.includes("name: 'Lamat'")) {
  failures.push('Registry does not define the canonical Lamat operator entry.')
}

if (!appSource.includes('<Companion />') || !appSource.includes('<LoginPage')) {
  failures.push('src/App.tsx must route unauthenticated users to LoginPage and authenticated users to Companion (Lamat).')
}

if (!loginSource.includes('signInWithGoogle') || !loginSource.includes('signInWithGitHub') || loginSource.includes('signInWithEmail')) {
  failures.push('Login page must wire Google and GitHub OAuth and exclude email/password login')
}

if (!companionSource.includes('/api/lamat') || !companionSource.includes('/api/companion-chat')) {
  failures.push('Lamat workspace must connect to both /api/lamat and /api/companion-chat.')
}

const apiFiles = (await fs.readdir(path.join(root, 'api'))).filter(
  (file) => file.endsWith('.js') && !file.startsWith('_')
)
if (apiFiles.length > 12) {
  failures.push(`Vercel Hobby serverless function limit exceeded: found ${apiFiles.length} public api/*.js files (max 12).`)
}

if (failures.length > 0) {
  console.error('Lamat application integrity audit failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Audited Lamat application integrity (${apiFiles.length} serverless function entrypoints: ${apiFiles.join(', ')}).`)
