/* eslint-disable no-template-curly-in-string -- Fixtures contain Vue template expressions. */
import type { RuleOptions } from './index'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import tsParser from '@typescript-eslint/parser'
import { Linter } from 'eslint'
import { describe, expect, it, vi } from 'vitest'
import vueParser from 'vue-eslint-parser'
import { harlanzw, plugin } from './index'

const linter = new Linter()
const parser = {
  files: ['**/*.vue'],
  languageOptions: { parser: vueParser, parserOptions: { parser: tsParser } },
}
const disabled = { link: false, nuxt: false, vue: false, prompt: false, content: false, pnpm: false }

function lint(code: string, nuxtUi: Parameters<typeof harlanzw>[0] = { nuxtUi: true }) {
  return linter.verify(code, [parser, ...harlanzw({ ...disabled, ...nuxtUi })], 'app/pages/index.vue')
}

describe('nuxt UI site integration', () => {
  it('reports actionable warnings and class construction errors through the factory', () => {
    const messages = lint('<template><UButton class="p-4" /><div :class="`bg-${color}`" /></template>')
    expect(messages.map(({ ruleId, severity }) => ({ ruleId, severity }))).toEqual([
      { ruleId: 'harlanzw/nuxt-ui-no-restyle', severity: 1 },
      { ruleId: 'harlanzw/vue-no-dynamic-tailwind-classes', severity: 2 },
    ])
    expect(messages[0].message).toContain('Use the size prop. See app/app.config.ts')
  })

  it('leaves existing users unchanged until enabled', () => {
    expect(lint('<template><UButton class="p-4" /></template>', { nuxtUi: false })).toEqual([])
  })

  it('uses site-defined sizes and shared styling paths', () => {
    const messages = lint('<template><UButton class="p-4" /></template>', {
      nuxtUi: { source: 'app/theme.ts', components: { UButton: { sizes: ['dense', 'roomy'] } } },
    })
    expect(messages[0].message).toBe('"p-4" overrides UButton styling. Use the size prop: dense, roomy. See app/theme.ts for shared styling.')
  })

  it('accepts deliberate slot overrides and standard component props', () => {
    expect(lint('<template><UButton size="lg" class="mt-4" :ui="{ label: \'truncate\' }" /></template>', {
      nuxtUi: { components: { UButton: { slots: { label: ['truncate'] } } } },
    })).toEqual([])
  })

  it('supports direct rule configuration with exported option types', () => {
    const options: RuleOptions['nuxt-ui-no-restyle'] = [{ components: { UButton: { allow: ['p-4'] } } }]
    expect(linter.verify('<template><UButton class="p-4" /></template>', [parser, {
      plugins: { harlanzw: plugin },
      rules: { 'harlanzw/nuxt-ui-no-restyle': ['error', ...options] },
    }], 'app.vue')).toEqual([])
  })

  it('does not autofix appearance', () => {
    const code = '<template><UButton class="p-4" /></template>'
    const result = linter.verifyAndFix(code, [parser, ...harlanzw({ ...disabled, nuxtUi: true })], { filename: 'app.vue' })
    expect(result.output).toBe(code)
    expect(result.messages[0].ruleId).toBe('harlanzw/nuxt-ui-no-restyle')
  })

  it('rejects invalid component options instead of silently ignoring them', () => {
    expect(() => linter.verify('<template><UButton /></template>', [parser, {
      plugins: { harlanzw: plugin },
      rules: { 'harlanzw/nuxt-ui-no-restyle': ['error', { components: { UButton: true } }] },
    }], 'app.vue')).toThrow(/allowed values/)
  })
})

describe('nuxt UI detection and wrappers', () => {
  it.each(['dependencies', 'devDependencies'])('enables from %s even with a Nuxt config', (field) => {
    const cwd = mkdtempSync(join(tmpdir(), 'design-lint-'))
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ [field]: { '@nuxt/ui': 'catalog:' } }))
    writeFileSync(join(cwd, 'nuxt.config.ts'), '')
    const spy = vi.spyOn(process, 'cwd').mockReturnValue(cwd)
    try {
      expect(lint('<template><UInput class="h-8" /></template>', {})[0]?.ruleId).toBe('harlanzw/nuxt-ui-no-restyle')
      expect(lint('<template><UInput class="h-8" /></template>', { nuxtUi: false })).toEqual([])
    }
    finally {
      spy.mockRestore()
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it('uses wrapper props for sizing and appearance, including imported aliases', () => {
    const messages = lint(`<script setup>import { UiButton as Action } from '#components'</script>
<template><Action class="text-lg bg-red-500" :ui="{ base: 'py-4' }" /></template>`, {
      nuxtUi: { source: 'layers/design-system/app/components/element/UiButton.vue', components: {
        UiButton: { sizes: ['sm', 'md', 'lg'], appearanceProp: 'purpose', variants: ['cta', 'secondary', 'quiet'] },
      } },
    })
    expect(messages.map(m => m.message)).toEqual([
      expect.stringContaining('Use the size prop: sm, md, lg.'),
      expect.stringContaining('Use the purpose prop: cta, secondary, quiet.'),
      expect.stringContaining('Use the size prop: sm, md, lg.'),
    ])
  })

  it('tracks a configured wrapper imported under a different local name', () => {
    const messages = lint(`<script setup>import Card from './UiCard.vue'</script>
<template><Card class="p-8" /></template>`, { nuxtUi: { components: { UiCard: { sizes: ['xs', 'sm', 'md', 'lg'] } } } })
    expect(messages[0]?.message).toContain('Use the size prop: xs, sm, md, lg.')
  })

  it('keeps valid wrapper sizes, placement, and unrelated icons', () => {
    expect(lint('<template><UiCard size="sm" class="mt-4 w-full" /><UiIcon class="size-4" /></template>', {
      nuxtUi: { components: { UiCard: { sizes: ['xs', 'sm', 'md', 'lg'] } } },
    })).toEqual([])
  })
})

describe('component sizing guidance', () => {
  it.each(['UButton', 'UBadge', 'UInput', 'UTextarea', 'USelect', 'USelectMenu', 'UInputMenu', 'UCheckbox', 'URadioGroup', 'USwitch', 'UAvatar'])('uses %s size props', (component) => {
    expect(lint(`<template><${component} class="md:text-lg h-10 px-6" /></template>`).map(m => m.message)).toEqual([
      expect.stringContaining('Use the size prop.'),
      expect.stringContaining('Use the size prop.'),
      expect.stringContaining('Use the size prop.'),
    ])
    expect(lint(`<template><${component} size="sm" class="mt-2 w-full" /></template>`)).toEqual([])
  })

  it('distinguishes arbitrary font sizes from text colors', () => {
    const messages = lint('<template><UInput class="text-[14px] text-[length:var(--font-size)] text-[var(--color)]" /></template>')
    expect(messages.map(m => m.message)).toEqual([
      expect.stringContaining('Use the size prop.'),
      expect.stringContaining('Use the size prop.'),
      expect.stringContaining('Use the color or variant prop.'),
    ])
  })
})

it('allows caller-controlled width and container height', () => {
  expect(lint('<template><UInput class="w-64 sm:max-w-lg min-w-0" /><UiCard class="h-full w-full" /></template>', {
    nuxtUi: { components: { UiCard: { sizes: ['xs', 'sm', 'md', 'lg'] } } },
  })).toEqual([])
})
