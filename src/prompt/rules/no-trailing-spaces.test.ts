import { createPromptRuleTester } from '../_test'
import rule from './no-trailing-spaces'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-no-trailing-spaces', rule, {
  valid: [
    'No trailing spaces.',
    'Line one\nLine two',
  ],
  invalid: [
    {
      code: 'Trailing spaces   ',
      errors: [{ messageId: 'trailing' }],
      output: 'Trailing spaces',
    },
    {
      code: 'Line one  \nLine two',
      errors: [{ messageId: 'trailing' }],
      output: 'Line one\nLine two',
    },
  ],
})
