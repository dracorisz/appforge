import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('button keeps canonical typography, geometry and direct icon size through shared tokens', async () => {
  const button = await read('src/components/ui/Button.tsx')
  const tokens = await read('src/components/ui/buttonStyles.ts')
  assert.match(button, /buttonBaseClass/)
  assert.match(button, /buttonVariantClasses/)
  assert.match(button, /buttonSizeClasses/)
  assert.match(tokens, /text-sm/)
  assert.match(tokens, /sm:\s*["']h-9 min-h-9 max-h-9 px-2["']/)
  assert.match(tokens, /md:\s*["']h-9 min-h-9 max-h-9 px-4["']/)
  assert.match(tokens, /lg:\s*["']h-9 min-h-9 max-h-9 px-8["']/)
  assert.match(tokens, /\[&>svg\]:h-4 \[&>svg\]:w-4/)
  assert.match(tokens, /has-\[img\]:h-auto has-\[img\]:max-h-none/)
  assert.match(tokens, /has-\[video\]:h-auto has-\[video\]:max-h-none/)
  assert.match(tokens, /focus-visible:ring-0/)
})

test('icon button uses the same variants, focus treatment and icon sizing', async () => {
  const source = await read('src/components/ui/IconButton.tsx')
  const tokens = await read('src/components/ui/buttonStyles.ts')
  assert.match(source, /buttonBaseClass/)
  assert.match(source, /buttonVariantClasses/)
  assert.match(source, /iconButtonSizeClasses/)
  assert.match(source, /aria-label=\{label\}/)
  assert.match(tokens, /sm:\s*["']h-9 min-h-9 max-h-9 w-9["']/)
})

test('form controls share one canonical 36px token source and native fallbacks', async () => {
  const tokens = await read('src/components/ui/controlStyles.ts')
  const inputs = await read('src/components/ui/Inputs.tsx')
  const select = await read('src/components/ui/Select.tsx')
  const css = await read('src/index.css')
  const tailwind = await read('tailwind.config.js')
  assert.match(tokens, /h-9 min-h-9 max-h-9/)
  assert.match(tokens, /px-4 text-sm/)
  assert.match(tokens, /rounded-xl/)
  assert.match(tokens, /focus:!ring-0/)
  assert.match(inputs, /controlClass, controlLabelClass/)
  assert.match(select, /controlClass, controlLabelClass/)
  assert.match(css, /--control-height:\s*2\.25rem/)
  assert.match(css, /--control-line-height:/)
  assert.match(css, /height:\s*var\(--control-height\)/)
  assert.match(css, /input:not\(\[type=["']checkbox["']\]\)/)
  assert.match(css, /select, textarea/)
  assert.match(tailwind, /9:\s*["']var\(--control-height\)["']/)
})

test('typography primitives expose only the intentional hierarchy', async () => {
  const heading = await read('src/components/ui/Heading.tsx')
  const typography = await read('src/components/ui/Typography.tsx')
  assert.match(heading, /hero:\s*["']text-5xl/)
  assert.match(heading, /title:\s*["']text-lg/)
  assert.match(heading, /compact:\s*["']text-sm/)
  assert.match(typography, /body:\s*["']text-sm/)
  assert.match(typography, /title:\s*["']text-lg/)
  assert.match(typography, /hero:\s*["']text-5xl/)
  assert.doesNotMatch(`${heading}\n${typography}`, /text-(?:base|xl|2xl|3xl|4xl|6xl|7xl|8xl|9xl)/)
})

test('surface primitive owns canonical visual surface variants', async () => {
  const surface = await read('src/components/ui/Surface.tsx')
  const card = await read('src/components/ui/Card.tsx')
  assert.match(surface, /surface-card/)
  assert.match(surface, /surface-panel/)
  assert.match(surface, /surface-muted/)
  assert.match(surface, /popover:\s*["']surface-popover["']/)
  assert.match(surface, /p-2/)
  assert.match(surface, /p-4/)
  assert.match(surface, /p-8/)
  assert.match(card, /<Surface/)
})

test('semantic palette, radius, borders, shadow and height have central token sources', async () => {
  const tailwind = await read('tailwind.config.js')
  const css = await read('src/index.css')
  assert.match(tailwind, /success:/)
  assert.match(tailwind, /warning:/)
  assert.match(tailwind, /info:/)
  assert.match(tailwind, /overlay:/)
  assert.match(tailwind, /inverse:/)
  assert.match(tailwind, /xl:\s*["']var\(--radius\)["']/)
  assert.match(tailwind, /xl:\s*["']var\(--shadow-xl\)["']/)
  assert.match(css, /--radius:\s*0\.35rem/)
  assert.match(css, /--control-height:\s*2\.25rem/)
  assert.match(css, /--pill-height:/)
  assert.match(css, /--border-opacity:/)
  assert.match(css, /--surface-border-opacity:/)
  assert.match(css, /--shadow-xl:/)
  assert.match(css, /--success:/)
  assert.match(css, /--warning:/)
  assert.match(css, /--info:/)
})

test('badges use standard UI text and centrally configured pill geometry', async () => {
  const badge = await read('src/components/ui/Badge.tsx')
  const buildBadge = await read('src/components/ui/BuildBadge.tsx')
  const css = await read('src/index.css')
  assert.match(badge, /app-pill.*rounded-xl.*border.*px-2 text-xs/)
  assert.match(buildBadge, /app-pill.*rounded-xl.*border.*px-2.*text-sm/)
  assert.match(css, /\.app-pill[\s\S]*height:\s*var\(--pill-height\)/)
})

test('file picker actions use a button and keep the native input outside labels', async () => {
  const source = await read('src/components/ui/FileButton.tsx')
  assert.match(source, /<input ref=\{setRef\} type="file"/)
  assert.match(source, /<Button/)
  assert.doesNotMatch(source, /<label/)
})

test('UI style checker enforces the project token contract and bans page-level native controls', async () => {
  const source = await read('scripts/check-ui-style.mjs')
  assert.match(source, /allowedFontSizes = new Set\(\['text-5xl', 'text-lg', 'text-sm'\]\)/)
  assert.match(source, /allowedSpacing = new Set\(\['2', '4', '8'\]\)/)
  assert.match(source, /text-xs requires an explicit design-xs-ok exception/)
  assert.match(source, /hard-coded palette utility/)
  assert.match(source, /noncanonical font weight/)
  assert.match(source, /forbidden radius/)
  assert.match(source, /forbidden shadow/)
  assert.match(source, /forbidden ring width/)
  assert.match(source, /rawControlBudget = 0/)
  assert.match(source, /process\.exit\(1\)/)
})

test('authentication flow retains only Google and GitHub OAuth and removes email/password login', async () => {
  const login = await read('src/auth/LoginPage.tsx')
  const app = await read('src/App.tsx')
  const authProvider = await read('src/auth/AuthProvider.tsx')

  assert.match(login, /Continue with Google/)
  assert.match(login, /Continue with GitHub/)
  assert.doesNotMatch(login, /signInWithEmail/)
  assert.doesNotMatch(login, /Forgot password\?/i)
  assert.doesNotMatch(authProvider, /signInWithEmail/)
  assert.match(authProvider, /https:\/\/www\.googleapis\.com\/auth\/drive/)
  assert.match(authProvider, /https:\/\/www\.googleapis\.com\/auth\/documents/)
  assert.match(authProvider, /https:\/\/www\.googleapis\.com\/auth\/spreadsheets/)
  assert.match(app, /location\.pathname\.startsWith\('\/auth\/'\)/)
})

test('Companion navigation, model selector, session menu, and Markdown parser meet B1-B11 requirements', async () => {
  const companion = await read('src/components/dashboard/Companion.tsx')
  const parts = await read('src/components/dashboard/CompanionParts.tsx')

  // B1 & Section 4: Left-aligned model selector without HF badge or dead Vertex Garden / Mistral entries
  assert.match(parts, /min-w-0 flex-1 truncate text-left/)
  assert.doesNotMatch(parts, /badge:\s*['"]HF['"]/)
  assert.doesNotMatch(parts, /vertex-claude:/)
  assert.doesNotMatch(parts, /Mistral-Small-24B-Instruct-2501/)

  // B2 & Section 9: Left-side nav buttons for Integrations, Memory & Persona, and Library; Logs removed from right panel
  assert.match(companion, /setShowIntegrationsModal\(true\)/)
  assert.match(companion, /setShowMemoryModal\(true\)/)
  assert.match(companion, /setShowLibraryModal\(true\)/)
  assert.doesNotMatch(companion, /railTab === 'logs'/)

  // B3: Dynamic browser document.title updates with activeSession
  assert.match(companion, /document\.title = currentTitle/)

  // B4: Analyze and Summary controls without "in new chat"
  assert.doesNotMatch(companion, /Analyze in new chat/)
  assert.doesNotMatch(companion, /Summarize in new chat/)
  assert.match(companion, /> Analyze\s*</)
  assert.match(companion, /> Summary\s*</)

  // B5: No textual [Attached: ...] duplication in composer displayContent
  assert.doesNotMatch(companion, /\\n\\n\[Attached:/)

  // B6: Ordered list parser keeps numbered items in one <ol> across nested bullets and blank lines
  assert.match(parts, /export function parseMarkdownBlocks/)
  assert.match(parts, /hasSubsequentNumberedItem/)
  assert.match(parts, /lastItem\.subItems\.push/)

  // B7 & B8: "Engine: Lamat" removed from left sidebar and LamatLogo removed from PersonaConfigModal
  assert.doesNotMatch(companion, /Engine:\s*Lamat/)

  // B10: Session overflow menu opens upward when near bottom of viewport
  assert.match(companion, /menuOpenUpward \? 'bottom-full mb-2' : 'top-full mt-1'/)

  // Section 11: Centralized working state with Stop button and AbortController
  assert.match(companion, /cancelActiveRequest/)
  assert.match(companion, /aria-label="Cancel active request"/)
})
