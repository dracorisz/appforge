import fs from 'node:fs'

const nextVersion = process.argv[2]

if (!nextVersion || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(nextVersion)) {
  console.error('Usage: npm run version:set -- 1.19.0')
  process.exit(1)
}

const writeJsonVersion = (path) => {
  if (!fs.existsSync(path)) return
  const data = JSON.parse(fs.readFileSync(path, 'utf8'))
  data.version = nextVersion
  if (data.packages?.['']) data.packages[''].version = nextVersion
  fs.writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`)
}

writeJsonVersion('package.json')
writeJsonVersion('package-lock.json')

const registryPath = 'src/lib/registry.ts'
const registry = fs.readFileSync(registryPath, 'utf8')
const updatedRegistry = registry.replace(
  /export const APPFORGE_VERSION = '[^']+'/,
  `export const APPFORGE_VERSION = '${nextVersion}'`,
)

if (updatedRegistry === registry) {
  console.error('Could not locate APPFORGE_VERSION in src/lib/registry.ts')
  process.exit(1)
}

fs.writeFileSync(registryPath, updatedRegistry)
console.log(`AppForge version set to ${nextVersion}`)
console.log('Remember: add meaningful release notes to APPFORGE_CHANGELOG when this is a named release.')
