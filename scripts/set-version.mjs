import fs from 'node:fs'

const nextVersion = process.argv[2]

if (!nextVersion || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(nextVersion)) {
  console.error('Usage: npm run version:set -- 1.27.0')
  process.exit(1)
}

const writeJsonVersion = (path) => {
  if (!fs.existsSync(path)) return false
  const data = JSON.parse(fs.readFileSync(path, 'utf8'))
  data.version = nextVersion
  if (data.packages?.['']) data.packages[''].version = nextVersion
  fs.writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`)
  return true
}

const touched = ['package.json', 'package-lock.json'].filter(writeJsonVersion)
if (!touched.length) {
  console.error('No root package metadata files were found.')
  process.exit(1)
}

const registryPath = 'src/lib/registry.ts'
if (fs.existsSync(registryPath)) {
  const registry = fs.readFileSync(registryPath, 'utf8')
  if (!/export const APPFORGE_VERSION = BUILD_INFO\.version/.test(registry)) {
    console.error('APPFORGE_VERSION must derive from BUILD_INFO.version before using version:set.')
    process.exit(1)
  }
}

console.log(`AppForge package metadata set to ${nextVersion}`)
console.log(`Updated: ${touched.join(', ')}`)
console.log('APPFORGE_VERSION derives from BUILD_INFO.version; do not hard-code a second product version.')
console.log('Remember to add meaningful release notes to APPFORGE_CHANGELOG for named releases.')
