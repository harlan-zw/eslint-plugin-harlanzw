import type { ESLint, Linter as LinterTypes } from 'eslint'
import type { RuleOptions } from './index'
import { readFileSync } from 'node:fs'
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

  it('scopes the docs config so the root allowlist never fires below the root', () => {
    const docs = plugin.configs?.docs
    expect(Array.isArray(docs)).toBe(true)
    if (!Array.isArray(docs))
      return

    const root = docs.find(block => (block as LinterTypes.Config).name === 'harlanzw/docs/root') as LinterTypes.Config
    const tree = docs.find(block => (block as LinterTypes.Config).name === 'harlanzw/docs/tree') as LinterTypes.Config

    // `*.md` without a leading `**/` is the repository root only. A root
    // allowlist that reached every nested folder would fail every docs file.
    expect(root.files).toEqual(['*.md'])
    expect(Object.keys(root.rules ?? {})).toContain('harlanzw/docs-root-allowlist')
    expect(Object.keys(tree.rules ?? {})).not.toContain('harlanzw/docs-root-allowlist')

    // The brief and reference rules self-filter on path, so they only need the tree.
    expect(Object.keys(tree.rules ?? {})).toEqual(
      expect.arrayContaining(['harlanzw/docs-work-brief-contract', 'harlanzw/docs-reference-no-status']),
    )
  })

  it('ships no contract rule in any config a repository enables without opting in', () => {
    // These five encode one person's convention about where Markdown lives and
    // what a brief must say. Every one of them stays behind `docs`.
    const OPINIONATED = [
      'harlanzw/docs-root-allowlist',
      'harlanzw/docs-work-brief-contract',
      'harlanzw/docs-reference-no-status',
      'harlanzw/docs-retired-pointer',
      'harlanzw/prompt-dangling-path',
    ]
    const defaultConfigs = ['recommended', 'content', 'prompt:recommended', 'prompt:strict', 'prompt:skill', 'link', 'nuxt', 'vue', 'tests', 'pnpm']

    for (const name of defaultConfigs) {
      const config = plugin.configs?.[name]
      if (!Array.isArray(config))
        continue
      const rules = config.flatMap(block => Object.keys((block as LinterTypes.Config).rules ?? {}))
      for (const rule of OPINIONATED)
        expect(rules, `${name} must not enable ${rule}`).not.toContain(rule)
    }
  })

  it('keeps the docs rules out of recommended, since the contract is a convention', () => {
    const recommended = plugin.configs?.recommended
    expect(Array.isArray(recommended)).toBe(true)
    if (!Array.isArray(recommended))
      return
    const rules = recommended.flatMap(block => Object.keys((block as LinterTypes.Config).rules ?? {}))
    expect(rules).not.toContain('harlanzw/docs-root-allowlist')
    expect(rules).not.toContain('harlanzw/docs-work-brief-contract')
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

  it('lists every public rule and the docs config in the README index', () => {
    const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8')
    const table = readme.slice(
      readme.indexOf('<!-- rules:start -->'),
      readme.indexOf('<!-- rules:end -->'),
    )
    for (const rule of ['docs-work-brief-contract', 'docs-reference-no-status', 'docs-root-allowlist', 'docs-retired-pointer', 'prompt-dangling-path'])
      expect(table, `README rules table is missing \`${rule}\``).toContain(rule)
    expect(readme).toContain('plugin.configs.docs')
  })

  it('states a docs scope per rule that matches its enabling config block', () => {
    const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8')
    const docs = plugin.configs?.docs
    expect(Array.isArray(docs)).toBe(true)
    if (!Array.isArray(docs))
      return

    const section = readme.slice(readme.indexOf('### Docs Rules'), readme.indexOf('## Sponsors'))

    // Each scope sentence names rules and the glob(s) that scope them, e.g.
    // "`a-rule` and `another-rule` apply to root `*.md` files only."
    const enabledRules = new Set(docs.flatMap(block => Object.keys((block as LinterTypes.Config).rules ?? {})))
    const stated = new Map<string, Set<string>>()
    for (const line of section.split('\n')) {
      const tokens = [...line.matchAll(/`([^`]+)`/g)].map(match => match[1])
      const rules = tokens.filter(token => enabledRules.has(`harlanzw/${token}`))
      const globs = tokens.filter(token => token.includes('.md'))
      if (!rules.length || !globs.length)
        continue
      for (const rule of rules)
        stated.set(rule, new Set([...(stated.get(rule) ?? []), ...globs]))
    }

    expect([...stated.keys()].sort()).toEqual([...enabledRules].map(name => name.replace('harlanzw/', '')).sort())

    const BLOCK_BY_GLOB: Record<string, string> = {
      '*.md': 'harlanzw/docs/root',
      'docs/**/*.md': 'harlanzw/docs/tree',
    }
    for (const [rule, globs] of stated) {
      const expectedBlocks = [...globs].map(glob => BLOCK_BY_GLOB[glob])
      expect(expectedBlocks, `README scopes \`${rule}\` with unknown globs: ${[...globs].join(', ')}`).not.toContain(undefined)
      const enablingBlocks = docs
        .filter(block => Object.keys((block as LinterTypes.Config).rules ?? {}).includes(`harlanzw/${rule}`))
        .map(block => (block as LinterTypes.Config).name)
      expect(enablingBlocks.sort()).toEqual(expectedBlocks.sort())
    }
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
