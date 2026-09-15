/* eslint-disable no-template-curly-in-string -- Fixtures contain Vue template expressions. */
import type { RuleOptions } from './index'
import tsParser from '@typescript-eslint/parser'
import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
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
