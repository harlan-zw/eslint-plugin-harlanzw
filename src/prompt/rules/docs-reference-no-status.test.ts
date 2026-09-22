import { createPromptRuleTester } from '../_test'
import rule from './docs-reference-no-status'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/docs-reference-no-status', rule, {
  valid: [
    { code: '# Architecture\n\nThe engine fetches, then extracts.', filename: 'docs/arch/README.md' },
    // A brief is where status belongs.
    { code: 'Status: open · 2026-09-22', filename: 'docs/work/EXECUTE-probe.md' },
    { code: 'Status: open · 2026-09-22', filename: 'README.md' },
    // A fenced example may show one.
    { code: '# Arch\n\n```md\nStatus: open\n```\n', filename: 'docs/arch/README.md' },
    // Prose that merely contains the word is not a status line.
    { code: 'The status code is 404.', filename: 'docs/arch/README.md' },
  ],
  invalid: [
    { code: 'Status: shipped', filename: 'docs/arch/README.md', errors: [{ messageId: 'status' }] },
    { code: '**Status:** shipped', filename: 'docs/postmortems/probe.md', errors: [{ messageId: 'status' }] },
    { code: '> Status: shipped', filename: 'docs/repros/probe.md', errors: [{ messageId: 'status' }] },
    { code: 'Status = shipped', filename: 'docs/runbooks/probe.md', errors: [{ messageId: 'status' }] },
    {
      code: 'Status: shipped',
      filename: 'docs/reference/probe.md',
      options: [{ dirs: ['docs/reference'] }],
      errors: [{ messageId: 'status' }],
    },
  ],
})
