import { createPromptRuleTester } from '../_test'
import rule from './docs-work-brief-contract'

const ruleTester = createPromptRuleTester()

const BRIEF = `# Probe

Status: open · 2026-09-22 · branch \`feat/probe\`

**Next move:** Ready. Delete this file.

Done means: the probe is gone.

## Ledger

- [ ] delete the probe

## Log

- 2026-09-22 created.
`

const OPEN = 'docs/work/EXECUTE-probe.md'

function brief(without: string) {
  return BRIEF.split('\n').filter(l => !l.startsWith(without)).join('\n')
}

ruleTester.run('harlanzw/docs-work-brief-contract', rule, {
  valid: [
    { code: BRIEF, filename: OPEN },
    // The index, a template and closed work are not open briefs.
    { code: 'no fields at all', filename: 'docs/work/README.md' },
    { code: 'no fields at all', filename: 'docs/work/_TEMPLATE.md' },
    { code: 'no fields at all', filename: 'docs/work/shipped/EXECUTE-probe.md' },
    // Nothing outside docs/work is a brief.
    { code: 'no fields at all', filename: 'docs/arch/README.md' },
    { code: 'no fields at all', filename: 'README.md' },
  ],
  invalid: [
    { code: brief('# Probe'), filename: OPEN, errors: [{ messageId: 'missingTitle' }] },
    { code: brief('Status:'), filename: OPEN, errors: [{ messageId: 'missingStatus' }] },
    { code: brief('**Next move:**'), filename: OPEN, errors: [{ messageId: 'missingNextMove' }] },
    { code: brief('Done means:'), filename: OPEN, errors: [{ messageId: 'missingDoneMeans' }] },
    { code: brief('## Ledger'), filename: OPEN, errors: [{ messageId: 'missingLedger' }] },
    { code: brief('## Log'), filename: OPEN, errors: [{ messageId: 'missingLog' }] },
    // A Next move with no bucket cannot say who is blocked.
    {
      code: BRIEF.replace('**Next move:** Ready.', '**Next move:** soon.'),
      filename: OPEN,
      errors: [{ messageId: 'badNextMove' }],
    },
    // A Log with no dated entry is not history.
    {
      code: BRIEF.replace('- 2026-09-22 created.', '- created at some point'),
      filename: OPEN,
      errors: [{ messageId: 'undatedLog' }],
    },
  ],
})
