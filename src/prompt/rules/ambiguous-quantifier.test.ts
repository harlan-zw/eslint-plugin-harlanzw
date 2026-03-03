import { createPromptRuleTester } from '../_test'
import rule from './ambiguous-quantifier'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-ambiguous-quantifier', rule, {
  valid: [
    'Use 2-3 examples.',
    'Return exactly 5 items.',
    '```\nReturn a few items\n```',
  ],
  invalid: [
    {
      code: 'Return a few items.',
      errors: [{ messageId: 'ambiguous', data: { found: 'a few', suggestion: '2-3' } }],
      output: 'Return 2-3 items.',
    },
    {
      code: 'Include several tests.',
      errors: [{ messageId: 'ambiguous', data: { found: 'several', suggestion: '5-7' } }],
      output: 'Include 5-7 tests.',
    },
  ],
})
