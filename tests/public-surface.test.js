import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('public sitemap contains only current canonical public AppForge routes', async () => {
  const sitemap = await read('public/sitemap.xml')
  assert.match(sitemap, /https:\/\/www\.sstoken\.space\/landing/)
  assert.match(sitemap, /https:\/\/www\.sstoken\.space\/explore/)
  assert.match(sitemap, /https:\/\/www\.sstoken\.space\/blog/)
  assert.match(sitemap, /https:\/\/www\.sstoken\.space\/changelog/)
  assert.match(sitemap, /https:\/\/www\.sstoken\.space\/huggingface/)
  assert.match(sitemap, /https:\/\/www\.sstoken\.space\/apps\/getter-pro/)
  assert.match(sitemap, /https:\/\/www\.sstoken\.space\/apps\/weather-now/)
  assert.match(sitemap, /https:\/\/www\.sstoken\.space\/apps\/any-converter/)
  assert.doesNotMatch(sitemap, /scrapper-pro/)
  assert.doesNotMatch(sitemap, /pariflow/)
})

test('SEO allowlist and canonical aliases match the public release surface', async () => {
  const seo = await read('src/lib/seo.ts')
  assert.match(seo, /'\/landing'/)
  assert.match(seo, /'\/explore'/)
  assert.match(seo, /'\/blog'/)
  assert.match(seo, /'\/changelog'/)
  assert.match(seo, /'\/huggingface'/)
  assert.match(seo, /'\/apps\/getter-pro'/)
  assert.match(seo, /'\/apps\/weather-now'/)
  assert.match(seo, /'\/apps\/any-converter'/)
  assert.match(seo, /'\/apps\/scrapper-pro': '\/apps\/getter-pro'/)
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
  const publicHeader = await read('src/components/public/PublicHeader.tsx')

  assert.match(app, /location\.pathname === '\/explore'.*PublicAppsPage/)
  assert.match(app, /!user && !loading && location\.pathname === '\/apps'.*Navigate to="\/explore"/)
  assert.match(landing, /<PublicHeader/)
  assert.match(publicHeader, /to="\/explore"[^>]*>Apps<\/Link>/)
  assert.match(landing, /https:\/\/docs\.sstoken\.space\//)
})

test('only durable repository workflows remain', async () => {
  const workflowNames = ['ci.yml', 'pages.yml']
  for (const name of workflowNames) {
    const content = await read(`.github/workflows/${name}`)
    assert.match(content, /name:/)
  }
})
