import { createPromptRuleTester } from '../_test'
import rule from './prompt-dangling-path'

const ruleTester = createPromptRuleTester()

// Every valid case names a path that really exists in this repository, so the
// test goes red if the tree moves under it.
const root = { root: process.cwd() }

ruleTester.run('harlanzw/prompt-dangling-path', rule, {
  valid: [
    { code: 'Rules live in `src/index.ts`.', options: [root] },
    { code: 'See `src/prompt/rules/docs-root-allowlist.ts`.', options: [root] },
    { code: 'The folder `src/prompt/` holds them.', options: [root] },
    // Not paths: a bare word, a package, a protocol, a home path, a glob, a command.
    { code: 'Run `eslint` first.', options: [root] },
    { code: 'Install `@antfu/eslint-config`.', options: [root] },
    { code: 'Fetch `https://example.com/thing`.', options: [root] },
    { code: 'Edit `~/.claude/settings.json`.', options: [root] },
    { code: 'Match `src/**/*.ts` to find them.', options: [root] },
    { code: 'Run `pnpm exec vitest run src/x.ts`.', options: [root] },
    { code: 'Use `npm:pkg/sub` as the ref.', options: [root] },
    // A fenced block is a sample, not a claim.
    { code: '```\nsee nope/missing.ts\n```', options: [root] },
    // Explicitly ignored.
    { code: 'See `nope/missing.ts`.', options: [{ ...root, ignore: ['nope/missing.ts'] }] },
  ],
  invalid: [
    {
      code: 'Rules live in `src/nope/missing.ts`.',
      options: [root],
      errors: [{ messageId: 'dangling', data: { path: 'src/nope/missing.ts' } }],
    },
    {
      code: 'Read `docs/arch/gone.md` and `src/index.ts`.',
      options: [root],
      errors: [{ messageId: 'dangling' }],
    },
  ],
})
