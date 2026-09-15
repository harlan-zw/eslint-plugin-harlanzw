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
    const messages = lint('<template><UInput class="text-[14px] text-[length:var(--font-size)] text-(length:--font-size) text-[var(--color)]" /></template>')
    expect(messages.map(m => m.message)).toEqual([
      expect.stringContaining('Use the size prop.'),
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

it('validates configured wrapper prop values and built-in variants', () => {
  const messages = lint(`<template><UButton variant="solidd" /><UiButton purpose="primary" /><UiCard :size="'huge'" /></template>`, {
    nuxtUi: { components: {
      UiButton: { appearanceProp: 'purpose', variants: ['cta', 'secondary', 'quiet'] },
      UiCard: { sizes: ['xs', 'sm', 'md', 'lg'] },
    } },
  })
  expect(messages.map(m => m.messageId)).toEqual(['invalidProp', 'invalidProp', 'invalidProp'])
  expect(messages[1].message).toContain('cta, secondary, quiet')
})

it('allows layout and custom hook classes without suggesting appearance props', () => {
  expect(lint('<template><UButton class="relative flex items-center custom-hook transition-transform" /></template>')).toEqual([])
})

it('preserves accessible minimum touch targets and responsive height limits', () => {
  expect(lint('<template><UInput class="min-h-11 sm:min-h-0 max-h-40" /><UButton class="opacity-0 group-hover:opacity-100" /></template>')).toEqual([])
})

it('validates static branches and constants in component prop bindings', () => {
  const messages = lint(`<script setup>const variant = 'solidd'</script><template><UButton :variant="variant" /><UInput :size="compact ? 'sm' : 'huge'" /></template>`)
  expect(messages.map(m => m.messageId)).toEqual(['invalidProp', 'invalidProp'])
})

it('keeps built-in prop validation when configured through a kebab-case name', () => {
  expect(lint('<template><u-button variant="solidd" /></template>', {
    nuxtUi: { components: { 'u-button': {} } },
  })[0]?.messageId).toBe('invalidProp')
})

it('does not mistake authored CSS hooks for Tailwind construction', () => {
  expect(lint('<template><div :class="`zone-band--${band}`" /><code :class="`shj-lang-${language}`" /><span :class="`is-${state}`" /></template><style>.is-ready { color: green; } .zone-band--healthy { opacity: 1; }</style>')).toEqual([])
})

it('gives shared-style guidance when a prop does not control the override', () => {
  const messages = lint('<template><UiButton class="rounded-full" /></template>', { nuxtUi: { components: { UiButton: { appearanceProp: 'purpose' } } } })
  expect(messages[0]?.message).not.toContain('Use the purpose prop')
  expect(messages[0]?.message).toContain('shared styling')
})

it('uses declared wrapper prop contracts without inventing defaults', () => {
  const messages = lint('<template><UiInput size="huge" variant="solidd" /><UiButton color="primary" :variant="variant" purpose="cta" /></template>', {
    nuxtUi: { components: {
      UiInput: { extends: 'UInput' },
      UiButton: { sizes: ['sm', 'md', 'lg'], appearanceProp: 'purpose', variants: ['cta', 'quiet'], forbiddenProps: ['color', 'variant'] },
    } },
  })
  expect(messages.map(message => message.messageId)).toEqual(['invalidProp', 'invalidProp', 'forbiddenProp', 'forbiddenProp'])
})

it('keeps utility construction visible when global CSS also targets that utility', () => {
  expect(lint('<template><div :class="`rounded-${radius}`" /></template><style>.rounded-lg { corner-shape: squircle; }</style>').map(message => message.messageId)).toEqual(['partialClass'])
})

it('checks class bindings without parsing unsupported style languages as CSS', () => {
  expect(lint('<template><div :class="`p-${size}`" /></template><style lang="stylus">.card\n  color red</style>').map(message => message.messageId)).toEqual(['partialClass'])
})

it('points wrapper overrides to the prop that actually owns the style', () => {
  const messages = lint('<template><UiChip class="font-mono text-sm tabular-nums" /></template>', {
    nuxtUi: { components: { UiChip: { sizes: ['xs', 'sm', 'md'], classProps: { 'font-mono': 'mono', 'tabular-nums': 'tabular' } } } },
  })
  expect(messages.map(message => message.message)).toEqual([
    expect.stringContaining('Use the mono prop.'),
    expect.stringContaining('Use the size prop: xs, sm, md.'),
    expect.stringContaining('Use the tabular prop.'),
  ])
})

it.each(['^2.21.1', '^3.3.7'])('does not apply v4 prop defaults to Nuxt UI %s', (version) => {
  const cwd = mkdtempSync(join(tmpdir(), 'design-legacy-'))
  writeFileSync(join(cwd, 'package.json'), JSON.stringify({ dependencies: { '@nuxt/ui': version } }))
  const spy = vi.spyOn(process, 'cwd').mockReturnValue(cwd)
  try {
    expect(lint('<template><UBadge color="red" /></template>', {})).toEqual([])
  }
  finally {
    spy.mockRestore()
    rmSync(cwd, { recursive: true, force: true })
  }
})

it('checks complete classes beside custom dynamic hooks', () => {
  expect(lint('<template><UButton :class="`rounded-full hook-${id} p-4`" /></template>').map(message => message.messageId)).toEqual(['restyle', 'restyle'])
})

it('does not suggest a variant prop on components without variants', () => {
  expect(lint('<template><UAvatar class="bg-red-500" /></template>')[0]?.message).not.toContain('variant')
})

it('validates object bindings and resolved spreads in Vue override order', () => {
  const code = `<script setup>const base = { size: 'huge', variant: 'solid' }; const props = { ...base, size: 'lg' }</script>
<template><UButton v-bind="base" /><UButton v-bind="props" /><UButton v-bind="base" size="sm" /><UButton size="sm" v-bind="base" /></template>`
  expect(lint(code).map(message => message.messageId)).toEqual(['invalidProp', 'invalidProp'])
})

it('keeps forbidden prop checks when a spread value is unknown', () => {
  expect(lint('<template><UiButton v-bind="{ variant: current, ...external }" /></template>', { nuxtUi: { components: { UiButton: { appearanceProp: 'purpose', forbiddenProps: ['variant'] } } } }).map(message => message.messageId)).toEqual(['forbiddenProp'])
  expect(lint('<template><UButton v-bind="{ size: \'huge\', ...external }" /></template>')).toEqual([])
})

it('does not trust values overwritten by nested unknown spreads', () => {
  expect(lint(`<script setup>const props = { ...external }</script><template><UButton v-bind="{ size: 'huge', ...props }" /></template>`)).toEqual([])
})

it.each(['props.size = "sm"', 'const alias = props; alias.size = "sm"', 'const alias = props as { size: string }; alias.size = "sm"'])('does not validate stale object values after mutation: %s', (mutation) => {
  expect(lint(`<script setup>const props = { size: 'huge' }; ${mutation}</script><template><UButton v-bind="props" /></template>`)).toEqual([])
})

it('keeps immutable class literals known when passed to a function', () => {
  expect(lint(`<script setup>const classes = 'p-4'; log(classes)</script><template><UButton :class="classes" /></template>`).map(message => message.messageId)).toEqual(['restyle'])
})

it('does not report class-object entries that Vue always excludes', () => {
  expect(lint('<template><UButton :class="{ \'p-4\': false, \'rounded-full\': 0, \'bg-red-500\': null }" /></template>')).toEqual([])
})

it('checks complete classes beside concatenated class fragments', () => {
  expect(lint('<template><UButton :class="\'rounded-full hook-\' + id + \' p-4\'" /></template>').map(message => message.messageId)).toEqual(['restyle', 'restyle'])
})

it('checks only effective ui slots for styling and dynamic classes', () => {
  expect(lint('<template><UButton :ui="{ base: \'p-4\', ...{ base: \'w-full\' } }" /></template>')).toEqual([])
  expect(lint('<template><UButton :ui="{ base: `p-${size}`, ...unknown }" /></template>')).toEqual([])
  expect(lint('<template><UButton :ui="{ ...{ base: \'p-4\' } }" /></template>').map(message => message.messageId)).toEqual(['restyle'])
  expect(lint('<template><UButton :ui="{ ...unknown, base: `p-${size}` }" /></template>').map(message => message.messageId)).toEqual(['partialClass'])
  expect(lint('<template><UButton :ui="{ base: \'p-4\', [slot]: \'w-full\' }" /></template>')).toEqual([])
  expect(lint('<template><UButton :ui="{ base: \'p-4\', base: \'w-full\' }" /></template>')).toEqual([])
})

it('checks wrapper-owned class targets without rejecting its layout container', () => {
  const options = { nuxtUi: { components: { UiCard: { classPatterns: ['[&_[data-card-body]]:*'], forbiddenProps: ['ui'], sizes: ['sm', 'md'] } } } }
  expect(lint('<template><UiCard class="p-4 rounded-t-none bg-default gap-3" /></template>', options)).toEqual([])
  expect(lint('<template><UiCard class="[&_[data-card-body]]:!p-4" /></template>', options).map(message => message.messageId)).toEqual(['restyle'])
  expect(lint('<template><UiCard :ui="{ body: \'!p-0\' }" /></template>', options).map(message => message.messageId)).toEqual(['forbiddenProp'])
  expect(lint('<template><UiCard :ui="{ body: \'!p-0\' }" /></template>', { nuxtUi: { components: { UiCard: { forbiddenProps: ['ui'], appearanceProp: 'variant' } } } })[0].message).toBe('UiCard does not expose ui. Use the shared component API.')
  expect(lint('<template><UiCard size="huge" /></template>', options).map(message => message.messageId)).toEqual(['invalidProp'])
  expect(lint('<template><UiInput class="bg-default" :ui="{ base: \'p-4\' }" /></template>', {
    nuxtUi: { components: { UiInput: { extends: 'UInput', classPatterns: ['[&_input]:*'] } } },
  }).map(message => message.messageId)).toEqual(['restyle'])
})

it('allows parent-filling dimensions without allowing fixed component sizes', () => {
  expect(lint('<template><UAvatar class="size-full! sm:size-auto" /></template>')).toEqual([])
  expect(lint('<template><UAvatar class="size-8" /></template>').map(message => message.messageId)).toEqual(['restyle'])
})
