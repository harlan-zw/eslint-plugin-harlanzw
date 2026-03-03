import { createPromptRuleTester } from '../_test'
import rule from './large-prompt'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-large-prompt', rule, {
  valid: [
    'Short prompt.',
    {
      code: 'x'.repeat(10000),
      options: [{ maxTokens: 5000 }],
    },
  ],
  invalid: [
    {
      code: 'x'.repeat(10000),
      errors: [{ messageId: 'large' }],
    },
    {
      code: 'x'.repeat(100),
      options: [{ maxTokens: 10 }],
      errors: [{ messageId: 'large' }],
    },
  ],
})
