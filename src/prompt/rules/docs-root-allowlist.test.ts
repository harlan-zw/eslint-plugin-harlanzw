import { createPromptRuleTester } from '../_test'
import rule from './docs-root-allowlist'

const ruleTester = createPromptRuleTester()

const root = '/repo'
const at = (name: string) => `${root}/${name}`

ruleTester.run('harlanzw/docs-root-allowlist', rule, {
  valid: [
    { code: '# Readme', filename: at('README.md'), options: [{ root }] },
    { code: '# Agents', filename: at('AGENTS.md'), options: [{ root }] },
    { code: '# Copy', filename: at('COPY.md'), options: [{ root }] },
    { code: '# Vision', filename: at('VISION.md'), options: [{ root }] },
    // Anything below the root has a lifecycle folder and is not this rule's business.
    { code: '# Notes', filename: at('docs/ideas/notes.md'), options: [{ root }] },
    { code: '# Brief', filename: at('docs/work/EXECUTE-x.md'), options: [{ root }] },
    // A dotfile at the root is scratch until someone tracks it.
    { code: '# Scratch', filename: at('.notes.md'), options: [{ root }] },
    // Not markdown.
    { code: 'code', filename: at('index.ts'), options: [{ root }] },
    // Extending the set for one repository.
    { code: '# Copy', filename: at('ROADMAP.md'), options: [{ root, additionalAllow: ['ROADMAP.md'] }] },
    // Replacing it outright.
    { code: '# Only', filename: at('ONLY.md'), options: [{ root, allow: ['ONLY.md'] }] },
  ],
  invalid: [
    {
      code: '# Plan',
      filename: at('PIVOT_PLAN.md'),
      options: [{ root }],
      errors: [{ messageId: 'notAllowed', data: { name: 'PIVOT_PLAN.md' } }],
    },
    {
      code: '# Context',
      filename: at('CONTEXT.md'),
      options: [{ root }],
      errors: [{ messageId: 'notAllowed' }],
    },
    {
      code: '# Readme',
      filename: at('README.md'),
      options: [{ root, allow: ['ONLY.md'] }],
      errors: [{ messageId: 'notAllowed' }],
    },
  ],
})
