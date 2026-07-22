import type { ESLint } from 'eslint'
import type { RuleOptions } from './index'
import { describe, expect, it } from 'vitest'
import harlanzw, { plugin } from './index'

const linkOptions: RuleOptions['link-lowercase'] = [{ ignoreExternal: true }]
const factoryPlugin: ESLint.Plugin = harlanzw.plugin

describe('plugin configs', () => {
  it('preserves options for every exported rule type', () => {
    expect(linkOptions).toEqual([{ ignoreExternal: true }])
    expect(factoryPlugin).toBe(plugin)
  })

  it('applies Nuxt and Vue rules to JavaScript and TypeScript module extensions', () => {
    const nuxtConfig = plugin.configs?.nuxt
    expect(Array.isArray(nuxtConfig)).toBe(true)
    if (!Array.isArray(nuxtConfig))
      throw new TypeError('Expected the Nuxt preset to be a config array')
    const nuxtFiles = nuxtConfig[0].files

    expect(nuxtFiles).toEqual([
      '**/*.vue',
      '**/*.js',
      '**/*.jsx',
      '**/*.mjs',
      '**/*.cjs',
      '**/*.ts',
      '**/*.tsx',
      '**/*.mts',
      '**/*.cts',
    ])
  })
})
