import { createPromptRuleTester } from '../_test'
import rule from './empty-variable'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-empty-variable', rule, {
  valid: [
    '{{name}}',
    'Hello {{user}}!',
    'No variables here.',
  ],
  invalid: [
    {
      code: 'Hello {{}} world',
      errors: [{ messageId: 'empty' }],
      output: 'Hello  world',
    },
    {
      code: 'Use {{  }} here',
      errors: [{ messageId: 'empty' }],
      output: 'Use  here',
    },
  ],
})
