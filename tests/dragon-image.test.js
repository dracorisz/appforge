import assert from 'node:assert/strict'
import test from 'node:test'
import { parsePersonalHfTokens } from '../api/dragon-image.js'

test('accepts the plural header sent by Story Studio', () => {
  assert.deepEqual(parsePersonalHfTokens({ 'x-hf-tokens': 'hf_first, hf_second,hf_third' }), ['hf_first', 'hf_second', 'hf_third'])
})

test('keeps legacy singular header support', () => {
  assert.deepEqual(parsePersonalHfTokens({ 'x-hf-token': 'hf_legacy' }), ['hf_legacy'])
})

test('deduplicates, validates, and caps personal tokens', () => {
  assert.deepEqual(
    parsePersonalHfTokens({ 'x-hf-tokens': 'bad,hf_one,hf_one,hf_two,hf_three,hf_four' }),
    ['hf_one', 'hf_two', 'hf_three'],
  )
})
