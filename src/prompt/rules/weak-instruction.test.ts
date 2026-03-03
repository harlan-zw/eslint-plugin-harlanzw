import { createPromptRuleTester } from '../_test'
import rule from './weak-instruction'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-weak-instruction', rule, {
  valid: [
    'Always use TypeScript.',
    'You must follow the style guide.',
    'Never use var.',
    '```\ntry to do something\n```',
  ],
  invalid: [
    {
      code: 'Try to use TypeScript.',
      errors: [{ messageId: 'weak', data: { found: 'Try to', suggestion: 'Always' } }],
      output: 'Always use TypeScript.',
    },
    {
      code: 'You could use classes.',
      errors: [{ messageId: 'weak', data: { found: 'could', suggestion: 'Must' } }],
      output: 'You Must use classes.',
    },
    {
      code: 'Consider using functional style.',
      errors: [{ messageId: 'weak', data: { found: 'Consider', suggestion: 'Must' } }],
      output: 'Must using functional style.',
    },
    {
      code: 'If possible, add tests.',
      errors: [{ messageId: 'weak', data: { found: 'If possible', suggestion: 'Must' } }],
      output: 'Must, add tests.',
    },
  ],
})
