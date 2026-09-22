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
    // A line number, a line range and a fragment anchor point into a file,
    // so they resolve to the path underneath them.
    { code: 'Rules live in `src/index.ts:42`.', options: [root] },
    { code: 'Read `src/index.ts:42-50` for the config.', options: [root] },
    { code: 'See `src/prompt/utils.ts#L214`.', options: [root] },
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
    {
      // A suffix still names the missing file underneath it.
      code: 'See `src/nope/missing.ts:42`.',
      options: [root],
      errors: [{ messageId: 'dangling', data: { path: 'src/nope/missing.ts:42' } }],
    },
    {
      code: 'See `src/nope/missing.md#L214`.',
      options: [root],
      errors: [{ messageId: 'dangling', data: { path: 'src/nope/missing.md#L214' } }],
    },
  ],
})
