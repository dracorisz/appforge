import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'

const CHANGELOG_PATH = new URL('../CHANGELOG.md', import.meta.url)
const PACKAGE_PATH = new URL('../package.json', import.meta.url)

export function parseReleases(source) {
  const releases = []
  const matcher = /^##\s+([^\n]+)$/gm
  const headings = [...source.matchAll(matcher)]
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index]
    const start = heading.index
    const end = headings[index + 1]?.index ?? source.length
    const title = heading[1].trim()
    const versionMatch = title.match(/\b(v?\d+\.\d+\.\d+(?:[-+][\w.-]+)?)\b/i)
    releases.push({
      title,
      version: versionMatch ? versionMatch[1].replace(/^v/i, '') : null,
      markdown: source.slice(start, end).trim(),
    })
  }
  return releases
}

export async function validateChangelog() {
  const [source, packageSource] = await Promise.all([
    readFile(CHANGELOG_PATH, 'utf8'),
    readFile(PACKAGE_PATH, 'utf8'),
  ])
  const packageJson = JSON.parse(packageSource)
  const releases = parseReleases(source)
  const errors = []

  if (!/^#\s+(?:AppForge\s+)?Changelog\s*$/m.test(source.split('\n')[0] || '')) errors.push('CHANGELOG.md must start with # Changelog or # AppForge Changelog.')
  if (!releases.length) errors.push('CHANGELOG.md must contain at least one ## release section.')
  const versions = releases.map((release) => release.version).filter(Boolean)
  if (new Set(versions).size !== versions.length) errors.push('CHANGELOG.md contains duplicate semantic versions.')
  if (!versions.includes(packageJson.version)) errors.push(`CHANGELOG.md must include the package version ${packageJson.version}.`)

  const current = releases.find((release) => release.version === packageJson.version)
  if (current) {
    if (!/^###\s+/m.test(current.markdown)) errors.push(`Release ${packageJson.version} must contain at least one ### group.`)
    if (!/^-\s+/m.test(current.markdown)) errors.push(`Release ${packageJson.version} must contain at least one bullet entry.`)
  }

  if (errors.length) {
    for (const error of errors) console.error(`changelog: ${error}`)
    process.exitCode = 1
    return false
  }
  console.log(`changelog: valid (${releases.length} release sections; package ${packageJson.version})`)
  return true
}

export async function extractRelease(version, outputPath) {
  const source = await readFile(CHANGELOG_PATH, 'utf8')
  const normalized = version.replace(/^v/i, '')
  const release = parseReleases(source).find((item) => item.version === normalized)
  if (!release) throw new Error(`No changelog release found for ${version}.`)
  const body = release.markdown.replace(/^##\s+[^\n]+\n?/, '').trim()
  if (!body) throw new Error(`Release ${version} has no notes.`)
  if (outputPath) await writeFile(outputPath, `${body}\n`, 'utf8')
  else process.stdout.write(`${body}\n`)
}

const [, , command = 'validate', ...args] = process.argv
if (command === 'validate') await validateChangelog()
else if (command === 'extract') await extractRelease(args[0], args[1])
else {
  console.error('Usage: node scripts/changelog.mjs validate | extract <version> [output-file]')
  process.exitCode = 1
}
