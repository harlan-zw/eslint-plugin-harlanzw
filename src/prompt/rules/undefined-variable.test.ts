import { createPromptRuleTester } from '../_test'
import rule from './undefined-variable'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-undefined-variable', rule, {
  valid: [
    'Hello {{user}}!',
    'The {{input}} goes here.',
    'name: John\nHello {{name}}!',
    {
      code: 'Use {{custom_var}} here.',
      options: [{ knownVariables: ['custom_var'] }],
    },
  ],
  invalid: [
    {
      code: 'Hello {{unknown_var}}!',
      errors: [{ messageId: 'undefined', data: { name: 'unknown_var' } }],
    },
  ],
})
