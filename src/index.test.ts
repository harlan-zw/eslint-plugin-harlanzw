import type { ESLint, Linter as LinterTypes } from 'eslint'
import type { RuleOptions } from './index'
import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import harlanzw, { plugin } from './index'

const linkOptions: RuleOptions['link-lowercase'] = [{ ignoreExternal: true }]
const factoryPlugin: ESLint.Plugin = harlanzw.plugin
const linter = new Linter()

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

  it('warns on file reads in tests without warning on source files', () => {
    const configs = harlanzw({
      content: false,
      link: false,
      nuxt: true,
      pnpm: false,
      prompt: false,
      vue: false,
    }) as LinterTypes.Config[]
    const code = `import { readFileSync } from 'node:fs'\nreadFileSync('src/index.ts', 'utf8')\n`

    expect(linter.verify(code, configs, 'src/example.test.js').map(({ ruleId, severity }) => ({ ruleId, severity })))
      .toEqual([{ ruleId: 'harlanzw/no-test-file-reads', severity: 1 }])
    expect(linter.verify(code, configs, 'src/example.js')).toEqual([])
  })
})
