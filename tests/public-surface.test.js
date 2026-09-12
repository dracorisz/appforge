import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

const blogRoutes = [
  '/blog',
  '/blog/desktop-buddy-your-ai-companion-on-the-desktop',
  '/blog/getter-pro-capture-web-media-with-a-clear-storage-model',
  '/blog/weather-now-fast-local-conditions-without-a-heavy-dashboard',
  '/blog/task-list-a-small-workspace-that-stays-out-of-the-way',
  '/blog/hugging-face-gallery-a-visible-home-for-generated-assets',
]

test('public sitemap contains only current canonical public AppForge routes', async () => {
  const sitemap = await read('public/sitemap.xml')
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  const expected = [
    'https://www.sstoken.space/',
    'https://www.sstoken.space/explore',
    ...blogRoutes.map((route) => `https://www.sstoken.space${route}`),
    'https://www.sstoken.space/changelog',
    'https://www.sstoken.space/apps/weather-now',
    'https://www.sstoken.space/apps/crypto-track',
    'https://www.sstoken.space/apps/data-converter',
    'https://www.sstoken.space/apps/favicon-studio',
    'https://www.sstoken.space/apps/svg-icons',
    'https://www.sstoken.space/apps/landing-builder',
    'https://www.sstoken.space/privacy',
    'https://www.sstoken.space/terms',
  ]
  assert.deepEqual(locations, expected)
  assert.doesNotMatch(sitemap, /pariflow/i)
  assert.doesNotMatch(sitemap, /scrapper-pro|getter-pro|ai-dragon-arena|\/huggingface/i)
  assert.doesNotMatch(sitemap, /\/settings|\/workspace|\/people|\/apps\/desktop-buddy|\/apps\/media-vault/)
})

test('SEO public routes derive from the registry and preserve canonical aliases', async () => {
  const seo = await read('src/lib/seo.ts')
  assert.match(seo, /\.\.\.getPublicApps\(\)\.map\(\(app\) => app\.route\)/)
  assert.match(seo, /'\/apps\/scrapper-pro': '\/apps\/getter-pro'/)
  assert.match(seo, /'\/pf-scrapper-pro': '\/apps\/getter-pro'/)
  assert.match(seo, /'\/apps\/any-converter': '\/apps\/data-converter'/)
  assert.doesNotMatch(seo, /'\/huggingface'/)
})

test('blog and changelog stay public while legacy content admin redirects into the protected admin console', async () => {
  const main = await read('src/main.tsx')
  const app = await read('src/App.tsx')
  assert.match(main, /location\.pathname === '\/blog'.*PublicBlogPage/s)
  assert.match(main, /location\.pathname === '\/changelog'.*ChangelogPage/s)
  assert.match(main, /location\.pathname === '\/admin\/content'.*Navigate to="\/settings\/admin"/s)
  assert.match(main, /location\.pathname\.startsWith\('\/blog\/'\)/)
  assert.match(app, /path="\/settings\/admin".*AdminConsolePage/s)

  const changelogPage = await read('src/components/public/ChangelogPage.tsx')
  assert.match(changelogPage, /CHANGELOG\.md\?raw/)
})

test('public Apps directory is permanent at explore while signed-in apps remains workspace-owned', async () => {
  const app = await read('src/App.tsx')
  const landing = await read('src/auth/LoginPage.tsx')
  const publicHeader = await read('src/components/public/PublicHeader.tsx')
  assert.match(app, /location\.pathname === '\/explore'.*PublicAppsPage/)
  assert.match(app, /!user && !loading && location\.pathname === '\/apps'.*Navigate to="\/explore"/)
  assert.match(landing, /<PublicHeader/)
  assert.match(publicHeader, /to="\/explore"[^>]*>Apps<\/Link>/)
  assert.match(landing, /https:\/\/docs\.sstoken\.space\//)
})

test('private registry apps remain behind authenticated routes and outside the public catalog', async () => {
  const registry = await read('src/lib/registry.ts')
  const app = await read('src/App.tsx')
  assert.match(registry, /PRIVATE_APP_IDS = new Set\(\['scrapper-pro', 'media-vault', 'desktop-buddy', 'ai-dragon-arena'\]\)/)
  assert.match(app, /privatePaths = new Set\(\['\/apps\/getter-pro','\/apps\/scrapper-pro','\/apps\/media-vault','\/apps\/desktop-buddy','\/apps\/ai-dragon-arena'\]\)/)
  assert.match(app, /privatePaths\.has\(location\.pathname\) \|\| location\.pathname === '\/huggingface'/)
})

test('only durable repository workflows remain', async () => {
  const workflowNames = ['ci.yml', 'pages.yml']
  for (const name of workflowNames) {
    const content = await read(`.github/workflows/${name}`)
    assert.match(content, /name:/)
  }
})
