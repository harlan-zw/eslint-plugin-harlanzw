/* eslint-disable no-template-curly-in-string -- Fixtures contain Vue template expressions. */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import tsParser from '@typescript-eslint/parser'
import { ESLint, Linter } from 'eslint'
import { afterAll, describe, expect, it } from 'vitest'
import vueParser from 'vue-eslint-parser'
import { tailwind } from './tailwind'

const directory = mkdtempSync(join(tmpdir(), 'harlanzw-theme-'))
const stylesheet = join(directory, 'main.css')
writeFileSync(stylesheet, `@theme { --spacing: 0.25rem; --color-brand: #123456; } @tailwind utilities; .site-logo { display: block; }`)
afterAll(() => rmSync(directory, { recursive: true, force: true }))
const parser = { files: ['**/*.vue'], languageOptions: { parser: vueParser, parserOptions: { parser: tsParser } } }
const config = await tailwind({ stylesheet, arbitraryValues: true })
const lint = (code: string) => new Linter().verify(code, [parser, config], 'app.vue')

describe('theme-aware Vue lint', () => {
  it('uses imported theme utilities and permits custom CSS and marker classes', () => {
    expect(lint('<template><div class="bg-brand p-4 site-logo group/card peer" /></template>')).toEqual([])
  })
  it('reports unknown utilities and variants using the compiler', () => {
    expect(lint('<template><div class="bg-brnad hovr:p-4" /></template>').map(m => m.ruleId)).toEqual([
      'harlanzw/vue-valid-tailwind-classes',
      'harlanzw/vue-valid-tailwind-classes',
    ])
  })
  it('permits classes defined inside the Vue stylesheet', () => {
    expect(lint('<template><div class="local-style" /></template><style scoped>.local-style { color: red; }</style>')).toEqual([])
  })
  it('enforces an explicit ban on arbitrary color and spacing', () => {
    expect(lint('<template><div class="hover:bg-[#123456] gap-[13px] p-(--space) w-[37px]" /></template>').map(m => m.ruleId)).toEqual([
      'harlanzw/vue-prefer-theme-tokens',
      'harlanzw/vue-prefer-theme-tokens',
    ])
  })
  it('checks bound arrays, const aliases, and ui slots', () => {
    expect(lint(`<script setup>const styles = { base: 'p-[13px]' }</script><template><UInput :ui="styles" :class="['bg-brnad']" /></template>`).map(m => m.ruleId)).toEqual([
      'harlanzw/vue-prefer-theme-tokens',
      'harlanzw/vue-valid-tailwind-classes',
    ])
  })
  it('fails visibly if the stylesheet cannot load', async () => {
    await expect(tailwind({ stylesheet: join(directory, 'missing.css') })).rejects.toThrow()
  })
  it('supports ESLint caching and invalidates it when the theme changes', async () => {
    const file = join(directory, 'page.vue')
    writeFileSync(file, '<template><div class="bg-brand" /></template>')
    const run = async () => {
      const theme = await tailwind({ stylesheet })
      const eslint = new ESLint({ cwd: directory, overrideConfigFile: true, overrideConfig: [parser, theme], cache: true, cacheLocation: join(directory, '.cache') })
      return (await eslint.lintFiles([file]))[0].messages
    }
    expect(await run()).toEqual([])
    writeFileSync(stylesheet, '@theme { --spacing: 0.25rem; } @tailwind utilities;')
    expect((await run())[0]?.ruleId).toBe('harlanzw/vue-valid-tailwind-classes')
  })
})

it('leaves unknown hook names alone but checks utility-shaped mistakes', () => {
  expect(lint('<template><div class="js-target not-prose language-ts" /></template>')).toEqual([])
  expect(lint('<template><div class="font-sm text-(--ui-primary)-400" /></template>').map(m => m.ruleId)).toEqual([
    'harlanzw/vue-valid-tailwind-classes',
    'harlanzw/vue-valid-tailwind-classes',
  ])
})

it('allows spacing expressions based on shared tokens and safe-area insets', () => {
  expect(lint('<template><div class="p-[calc(var(--space)*2)] pb-[max(2rem,env(safe-area-inset-bottom))]" /></template>')).toEqual([])
})

it('enforces approved color and spacing values', async () => {
  // This test owns a distinct stylesheet because the cache test edits the first one.
  const path = join(directory, 'policy.css')
  writeFileSync(path, '@theme { --spacing: 0.25rem; --color-brand: #123456; --color-other: #654321; } @tailwind utilities;')
  const config = await tailwind({ stylesheet: path, colors: ['brand'], spacing: ['2', '4'] })
  const messages = new Linter().verify('<template><div class="bg-brand p-4 bg-other p-3" /></template>', [parser, config], 'app.vue')
  expect(messages.map(m => m.message)).toEqual([
    expect.stringContaining('Use brand'),
    expect.stringContaining('Use 2, 4'),
  ])
})

it('checks custom names in strict mode and accepts an explicit allowance', async () => {
  const config = await tailwind({ stylesheet, strict: true, allow: ['js-*'] })
  const messages = new Linter().verify('<template><div class="js-target misspelled" /></template>', [parser, config], 'app.vue')
  expect(messages.map(m => m.message)).toEqual([expect.stringContaining('"misspelled"')])
})

it('invalidates ESLint cache when an imported layer theme changes', async () => {
  const path = join(directory, 'layer.css')
  const file = join(directory, 'layer.vue')
  writeFileSync(path, '@theme { --color-layer: #112233; } .layer-hook { display: block; }')
  writeFileSync(file, '<template><div class="bg-layer layer-hook" /></template>')
  const run = async () => {
    const config = await tailwind({ stylesheet, stylesheets: [path], strict: true })
    const eslint = new ESLint({ cwd: directory, overrideConfigFile: true, overrideConfig: [parser, config], cache: true, cacheLocation: join(directory, '.layer-cache') })
    return (await eslint.lintFiles([file]))[0].messages
  }
  expect(await run()).toEqual([])
  writeFileSync(path, '@theme { --color-renamed: #112233; } .layer-hook { display: block; }')
  expect((await run())[0]?.ruleId).toBe('harlanzw/vue-valid-tailwind-classes')
})

it('checks hard-coded values in arbitrary CSS properties', () => {
  expect(lint('<template><div class="[color:#123456] [padding:13px]" /></template>').map(m => m.ruleId)).toEqual([
    'harlanzw/vue-prefer-theme-tokens',
    'harlanzw/vue-prefer-theme-tokens',
  ])
})

it('accepts custom utilities and custom variants from the stylesheet', async () => {
  const path = join(directory, 'custom.css')
  writeFileSync(path, '@theme { --spacing: 0.25rem; } @tailwind utilities; @utility custom-surface { display: block; } @custom-variant hocus (&:hover, &:focus);')
  const config = await tailwind({ stylesheet: path, strict: true })
  expect(new Linter().verify('<template><div class="hocus:custom-surface hocus:p-4" /></template>', [parser, config], 'app.vue')).toEqual([])
})

it('preserves inheritance and third-party brand colors without a conflicting site policy', async () => {
  const path = join(directory, 'precision.css')
  writeFileSync(path, '@theme { --spacing: 0.25rem; --color-brand: #123456; } @tailwind utilities;')
  const config = await tailwind({ stylesheet: path })
  expect(new Linter().verify('<template><div class="text-[inherit] bg-[#34a853] px-[0.3rem]" /></template>', [parser, config], 'app.vue')).toEqual([])
  expect(new Linter().verify('<template><div class="bg-[#123456]" /></template>', [parser, config], 'app.vue')[0]?.message).toContain('bg-brand')
})

it('accepts Nuxt UI semantic colors declared by the generated theme', async () => {
  const path = join(directory, 'nuxt-ui.css')
  writeFileSync(path, '@theme inline { --color-important: var(--ui-important); --color-brand: #123456; } @tailwind utilities;')
  const theme = await tailwind({ stylesheet: path })
  const messages = new Linter().verify('<template><div class="p-[1px]" /><UBadge color="important" /><UBadge color="brand" /></template>', [parser, theme, { rules: { 'harlanzw/nuxt-ui-no-restyle': 'warn' } }], 'app.vue')
  expect(messages.filter(message => message.messageId === 'invalidProp').map(message => message.message)).toEqual([expect.stringContaining('"brand" is not a supported UBadge color')])
})

it('checks complete utilities next to a partially constructed class', () => {
  expect(lint('<template><div :class="`bg-brnad hook-${id} p-4`" /></template>').map(message => message.ruleId)).toEqual(['harlanzw/vue-valid-tailwind-classes'])
})
