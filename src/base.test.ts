import type { Linter as LinterTypes } from 'eslint'
import { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import { base } from './base'
import harlanzw from './index'

const linter = new Linter()

function lint(code: string, configs: LinterTypes.Config[], filename: string) {
  return linter.verify(code, configs, filename).map(m => m.ruleId)
}

function blockNamed(configs: LinterTypes.Config[], name: string) {
  const block = configs.find(c => c.name === name)
  if (!block)
    throw new Error(`Expected a config block named ${name}`)
  return block
}

const USE_BEFORE_DEFINE = 'foo()\nfunction foo() {}\n'

describe('base', () => {
  it('turns off rules the preset before it enabled', () => {
    const strict: LinterTypes.Config[] = [
      { files: ['**/*.js'], rules: { 'no-use-before-define': 'error' } },
    ]

    expect(lint(USE_BEFORE_DEFINE, strict, 'src/a.js')).toEqual(['no-use-before-define'])
    expect(lint(USE_BEFORE_DEFINE, [...strict, ...base()], 'src/a.js')).toEqual([])
  })

  it('relaxes test files without relaxing source files', () => {
    const configs = [
      { files: ['**/*.js'], rules: { 'no-console': 'error' } } as LinterTypes.Config,
      ...base(),
    ]

    expect(lint('console.log(1)\n', configs, 'src/a.js')).toEqual(['no-console'])
    expect(lint('console.log(1)\n', configs, 'src/a.test.js')).toEqual([])
    expect(lint('console.log(1)\n', configs, 'test/a.js')).toEqual([])
    expect(lint('console.log(1)\n', configs, 'tests/nested/a.js')).toEqual([])
  })

  it('relaxes code fences in markdown', () => {
    const configs = [
      { files: ['**/*.md/**'], rules: { 'no-console': 'error' } } as LinterTypes.Config,
      ...base(),
    ]

    expect(lint('console.log(1)\n', configs, 'README.md/0.js')).toEqual([])
  })

  it('drops the return type rule for libraries but not apps', () => {
    expect(blockNamed(base(), 'harlanzw/base/rules').rules)
      .toHaveProperty('ts/explicit-function-return-type', 'off')

    expect(blockNamed(base({ type: 'app' }), 'harlanzw/base/rules').rules)
      .not
      .toHaveProperty('ts/explicit-function-return-type')
  })

  it('ignores the prompts you wrote by default', () => {
    const ignores = blockNamed(base(), 'harlanzw/base/agent-ignores').ignores

    expect(ignores).toContain('**/CLAUDE.md')
    expect(ignores).toContain('**/AGENTS.md')
  })

  it('leaves the prompts you wrote alone when something else lints them', () => {
    const ignores = blockNamed(base({ agentFiles: 'lint' }), 'harlanzw/base/agent-ignores').ignores

    expect(ignores).not.toContain('**/CLAUDE.md')
    expect(ignores).not.toContain('**/AGENTS.md')
  })

  it('ignores the agent tool directory whatever agentFiles says', () => {
    for (const agentFiles of ['ignore', 'lint'] as const) {
      const ignores = blockNamed(base({ agentFiles }), 'harlanzw/base/agent-ignores').ignores

      expect(ignores, agentFiles).toContain('**/.claude/**')
    }
  })

  it('keeps a checked-out worktree under the agent directory out of the run', () => {
    const configs = [
      { files: ['**/*.ts'], rules: { 'no-console': 'error' } } as LinterTypes.Config,
      ...base({ agentFiles: 'lint' }),
    ]

    const nested = '.claude/w/some-branch/src/index.ts'
    expect(lint('console.log(1)\n', configs, nested)).not.toContain('no-console')
  })

  it('keeps a vendored skill out of the run while linting the repo CLAUDE.md', () => {
    const configs = [
      { files: ['**/*.md'], rules: { 'no-console': 'error' } } as LinterTypes.Config,
      ...base({ agentFiles: 'lint' }),
    ]

    expect(lint('console.log(1)\n', configs, 'CLAUDE.md')).toEqual(['no-console'])
    expect(lint('console.log(1)\n', configs, '.claude/skills/vitest-skilld/SKILL.md')).not.toContain('no-console')
  })

  it('ignores nested playgrounds, fixtures, and data dirs', () => {
    const ignores = blockNamed(base(), 'harlanzw/base/ignores').ignores as string[]

    for (const glob of ignores) {
      expect(glob.startsWith('**/'), `${glob} is root anchored`).toBe(true)
    }
  })

  it('drops the path ignore block entirely when the repo wants to own it', () => {
    const configs = base({ ignores: false })

    expect(configs.find(c => c.name === 'harlanzw/base/ignores')).toBeUndefined()
    // The rule blocks still apply.
    expect(configs.map(c => c.name)).toContain('harlanzw/base/rules')
  })

  it('keeps vendored agent content ignored even when the repo owns its ignores', () => {
    const configs = [
      { files: ['**/*.md'], rules: { 'no-console': 'error' } } as LinterTypes.Config,
      ...base({ ignores: false, agentFiles: 'lint' }),
    ]

    // A repo that lints its playground still has no reason to lint upstream docs.
    expect(lint('console.log(1)\n', configs, '.claude/skills/vitest-skilld/SKILL.md')).not.toContain('no-console')
  })

  it('keeps a file lintable when the shared ignores are dropped', () => {
    const configs = [
      { files: ['**/*.js'], rules: { 'no-console': 'error' } } as LinterTypes.Config,
      ...base({ ignores: false }),
    ]

    const shared = [
      { files: ['**/*.js'], rules: { 'no-console': 'error' } } as LinterTypes.Config,
      ...base(),
    ]

    // `playground/**` is in the shared set, so the rule only reaches it without.
    expect(lint('console.log(1)\n', shared, 'playground/a.js')).not.toContain('no-console')
    expect(lint('console.log(1)\n', configs, 'playground/a.js')).toEqual(['no-console'])
  })

  it('appends extra ignores to the shared set', () => {
    const ignores = blockNamed(base({ ignores: ['docs/**'] }), 'harlanzw/base/ignores').ignores

    expect(ignores).toContain('docs/**')
    expect(ignores).toContain('**/playground/**')
  })
})

describe('harlanzw({ base })', () => {
  const off = { link: false, nuxt: false, vue: false, prompt: false, content: false, pnpm: false } as const

  it('is opt in', () => {
    const names = harlanzw(off).map(c => c.name)

    expect(names).toEqual([])
  })

  it('emits the base blocks before the rule configs', () => {
    const configs = harlanzw({ ...off, base: true, nuxt: true })
    const names = configs.map(c => c.name)

    expect(names[0]).toBe('harlanzw/base/agent-ignores')
    expect(names).toContain('harlanzw/nuxt')
    expect(names.indexOf('harlanzw/base/examples')).toBeLessThan(names.indexOf('harlanzw/nuxt'))
  })

  it('keeps agent files lintable when the prompt config is on', () => {
    const withPrompt = harlanzw({ ...off, base: true, prompt: true })
    const withoutPrompt = harlanzw({ ...off, base: true, prompt: false })

    expect(blockNamed(withPrompt, 'harlanzw/base/agent-ignores').ignores).not.toContain('**/CLAUDE.md')
    expect(blockNamed(withoutPrompt, 'harlanzw/base/agent-ignores').ignores).toContain('**/CLAUDE.md')
  })

  it('lets an explicit agentFiles choice win over the prompt default', () => {
    const configs = harlanzw({ ...off, base: { agentFiles: 'ignore' }, prompt: true })

    expect(blockNamed(configs, 'harlanzw/base/agent-ignores').ignores).toContain('**/CLAUDE.md')
  })

  it('forwards base options', () => {
    const configs = harlanzw({ ...off, base: { type: 'app', ignores: ['tmp/**'] } })

    expect(blockNamed(configs, 'harlanzw/base/ignores').ignores).toContain('tmp/**')
    expect(blockNamed(configs, 'harlanzw/base/rules').rules)
      .not
      .toHaveProperty('ts/explicit-function-return-type')
  })
})
