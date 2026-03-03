import { createPromptRuleTester } from '../_test'
import rule from './subsumed-constraint'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-subsumed-constraint', rule, {
  valid: [
    'Never use var.\nAlways use const.',
    'Avoid side effects.',
  ],
  invalid: [
    {
      code: 'Never use var declarations.\nAvoid use var declarations.',
      errors: [{ messageId: 'subsumed' }],
      output: 'Never use var declarations.',
    },
  ],
})
