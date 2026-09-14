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
  assert.match(tokens, /sm: 'h-8 px-2'/)
  assert.match(tokens, /md: 'h-10 px-4'/)
  assert.match(tokens, /\[&>svg\]:h-4 \[&>svg\]:w-4/)
  assert.match(tokens, /focus-visible:ring-1/)
})

test('icon button uses the same variants, focus treatment and icon sizing', async () => {
  const source = await read('src/components/ui/IconButton.tsx')
  assert.match(source, /buttonBaseClass/)
  assert.match(source, /buttonVariantClasses/)
  assert.match(source, /iconButtonSizeClasses/)
  assert.match(source, /aria-label=\{label\}/)
})

test('form controls share one canonical token source and native fallbacks', async () => {
  const tokens = await read('src/components/ui/controlStyles.ts')
  const inputs = await read('src/components/ui/Inputs.tsx')
  const select = await read('src/components/ui/Select.tsx')
  const css = await read('src/index.css')
  assert.match(tokens, /h-10/)
  assert.match(tokens, /px-4 py-2 text-sm/)
  assert.match(tokens, /rounded-xl/)
  assert.match(tokens, /focus:ring-1/)
  assert.match(inputs, /controlClass, controlLabelClass/)
  assert.match(select, /controlClass, controlLabelClass/)
  assert.match(css, /input:not\(\[type='checkbox'\]\)/)
  assert.match(css, /select, textarea/)
})

test('typography primitives expose only the intentional hierarchy', async () => {
  const heading = await read('src/components/ui/Heading.tsx')
  const typography = await read('src/components/ui/Typography.tsx')
  assert.match(heading, /hero: 'text-5xl/)
  assert.match(heading, /title: 'text-lg/)
  assert.match(heading, /compact: 'text-sm/)
  assert.match(typography, /body: 'text-sm'/)
  assert.match(typography, /title: 'text-lg/)
  assert.match(typography, /hero: 'text-5xl/)
  assert.doesNotMatch(`${heading}\n${typography}`, /text-(?:base|xl|2xl|3xl|4xl|6xl|7xl|8xl|9xl)/)
})

test('surface primitive owns canonical visual surface variants', async () => {
  const surface = await read('src/components/ui/Surface.tsx')
  const card = await read('src/components/ui/Card.tsx')
  assert.match(surface, /surface-card/)
  assert.match(surface, /surface-panel/)
  assert.match(surface, /surface-muted/)
  assert.match(surface, /surface-popover shadow-xl/)
  assert.match(surface, /p-2/)
  assert.match(surface, /p-4/)
  assert.match(surface, /p-8/)
  assert.match(card, /<Surface/)
})

test('semantic palette and radius have a single token source', async () => {
  const tailwind = await read('tailwind.config.js')
  const css = await read('src/index.css')
  assert.match(tailwind, /success:/)
  assert.match(tailwind, /warning:/)
  assert.match(tailwind, /info:/)
  assert.match(tailwind, /overlay:/)
  assert.match(tailwind, /inverse:/)
  assert.match(tailwind, /xl: 'var\(--radius\)'/)
  assert.match(css, /--radius: 0\.75rem/)
  assert.match(css, /--success:/)
  assert.match(css, /--warning:/)
  assert.match(css, /--info:/)
})

test('badges use standard UI text and compact canonical geometry', async () => {
  const badge = await read('src/components/ui/Badge.tsx')
  const buildBadge = await read('src/components/ui/BuildBadge.tsx')
  assert.match(badge, /h-8.*rounded-xl.*border.*px-2 text-sm/)
  assert.match(buildBadge, /h-8.*rounded-xl.*border.*px-2.*text-sm/)
})

test('UI style checker enforces the project token contract', async () => {
  const source = await read('scripts/check-ui-style.mjs')
  assert.match(source, /allowedFontSizes = new Set\(\['text-5xl', 'text-lg', 'text-sm'\]\)/)
  assert.match(source, /allowedSpacing = new Set\(\['2', '4', '8'\]\)/)
  assert.match(source, /text-xs requires an explicit design-xs-ok exception/)
  assert.match(source, /hard-coded palette utility/)
  assert.match(source, /noncanonical font weight/)
  assert.match(source, /forbidden radius/)
  assert.match(source, /forbidden shadow/)
  assert.match(source, /forbidden ring width/)
  assert.match(source, /process\.exit\(1\)/)
})
