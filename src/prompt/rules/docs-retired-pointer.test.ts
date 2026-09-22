import { createPromptRuleTester } from '../_test'
import rule from './docs-retired-pointer'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/docs-retired-pointer', rule, {
  valid: [
    'Read AGENTS.md before you start.',
    // The global instruction file is genuinely named CLAUDE.md and nothing renamed it.
    'Global writing rules live in `~/.claude/CLAUDE.md`.',
    'Global writing rules live in `/home/harlan/.claude/CLAUDE.md`.',
    'Global writing rules live in `$HOME/.claude/CLAUDE.md`.',
    // A fenced example may show the retired name.
    '```\nsee CLAUDE.md\n```',
    // An empty map turns the rule off.
    { code: 'see CLAUDE.md', options: [{ retired: {} }] },
    // A link URL names a file on another site, not a pointer into this one.
    { code: 'Archive: [old rules](https://example.com/CLAUDE.md).' },
  ],
  invalid: [
    { code: 'see CLAUDE.md for the rules', errors: [{ messageId: 'retired' }] },
    { code: 'vocabulary lives in CONTEXT.md', errors: [{ messageId: 'retired' }] },
    // A line may cite the global file and still carry a bare pointer.
    // The report points at the bare name on the original line, not at the
    // shifted position left by the stripped external path.
    {
      code: 'See `~/.claude/CLAUDE.md`, and this repo\'s CLAUDE.md too.',
      errors: [{ messageId: 'retired', column: 44, endColumn: 53 }],
    },
    {
      code: 'see OLD.md',
      options: [{ retired: { 'OLD.md': 'NEW.md' } }],
      errors: [{ messageId: 'retired' }],
    },
    // A relative link URL is a broken in-repo pointer, the most common form.
    // The report points at the retired name inside the URL.
    {
      code: 'Archive: [old rules](CLAUDE.md).',
      errors: [{ messageId: 'retired', column: 22, endColumn: 31 }],
    },
    // A remote-URL hit must not mask a bare pointer later on the same line.
    // The report points at the bare second occurrence.
    {
      code: 'see [y](https://e.com/CLAUDE.md) and CLAUDE.md',
      errors: [{ messageId: 'retired', column: 38, endColumn: 47 }],
    },
  ],
})
