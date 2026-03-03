import { createPromptRuleTester } from '../_test'
import rule from './vague-term'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-vague-term', rule, {
  valid: [
    'Code must be well-tested.',
    'Use snake_case naming.',
    'Output should be in JSON format.',
  ],
  invalid: [
    {
      code: 'Output should be appropriate.',
      errors: [{ messageId: 'vague', data: { found: 'be appropriate' } }],
    },
    {
      code: 'Write in a professional manner.',
      errors: [{ messageId: 'vague', data: { found: 'in a professional' } }],
    },
  ],
})
