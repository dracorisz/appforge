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
    'https://www.sstoken.space/apps/getter-pro',
    'https://www.sstoken.space/apps/weather-now',
    'https://www.sstoken.space/apps/crypto-track',
    'https://www.sstoken.space/apps/any-converter',
    'https://www.sstoken.space/apps/favicon-studio',
    'https://www.sstoken.space/apps/svg-icons',
    'https://www.sstoken.space/apps/landing-builder',
    'https://www.sstoken.space/apps/ai-dragon-arena',
    'https://www.sstoken.space/huggingface',
    'https://www.sstoken.space/privacy',
    'https://www.sstoken.space/terms',
  ]
  assert.deepEqual(locations, expected)
  assert.doesNotMatch(sitemap, /pariflow/i)
  assert.doesNotMatch(sitemap, /scrapper-pro/i)
  assert.doesNotMatch(sitemap, /\/settings|\/workspace|\/people|\/apps\/desktop-buddy/)
})

test('SEO allowlist and canonical aliases match the public release surface', async () => {
  const seo = await read('src/lib/seo.ts')
  for (const route of [
    '/explore',
    '/apps/getter-pro',
    '/apps/weather-now',
    '/apps/crypto-track',
    '/apps/any-converter',
    '/apps/favicon-studio',
    '/apps/svg-icons',
    '/apps/landing-builder',
    '/apps/ai-dragon-arena',
  ]) {
    assert.match(seo, new RegExp(`['"]${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`))
  }
  assert.match(seo, /'\/apps\/scrapper-pro': '\/apps\/getter-pro'/)
  assert.match(seo, /'\/pf-scrapper-pro': '\/apps\/getter-pro'/)
})

test('blog, changelog and content admin routes stay intentionally exposed at the root router', async () => {
  const main = await read('src/main.tsx')
  assert.match(main, /location\.pathname === '\/blog'.*PublicBlogPage/s)
  assert.match(main, /location\.pathname === '\/changelog'.*ChangelogPage/s)
  assert.match(main, /location\.pathname === '\/admin\/content'.*AdminContentManager/s)
  assert.match(main, /location\.pathname\.startsWith\('\/blog\/'\)/)

  const changelogPage = await read('src/components/public/ChangelogPage.tsx')
  assert.match(changelogPage, /CHANGELOG\.md\?raw/)
})

test('public Apps directory is permanent at explore while signed-in apps remains workspace-owned', async () => {
  const app = await read('src/App.tsx')
  const landing = await read('src/auth/LoginPage.tsx')
  assert.match(app, /location\.pathname === '\/explore'.*PublicAppsPage/)
  assert.match(app, /!user && !loading && location\.pathname === '\/apps'.*Navigate to="\/explore"/)
  assert.match(landing, /to="\/explore"[^>]*>.*Apps/s)
  assert.match(landing, /https:\/\/docs\.sstoken\.space\//)
})

test('only durable repository workflows remain', async () => {
  const workflowNames = ['ci.yml', 'pages.yml']
  for (const name of workflowNames) {
    const content = await read(`.github/workflows/${name}`)
    assert.match(content, /name:/)
  }
})
