import { createPromptRuleTester } from '../_test'
import rule from './unresolved-reference'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-unresolved-reference', rule, {
  valid: [
    'Use TypeScript for all files.',
    'Follow the style guide at https://example.com.',
  ],
  invalid: [
    {
      code: 'See above for details.',
      errors: [{ messageId: 'unresolved', data: { found: 'See above' } }],
    },
    {
      code: 'As mentioned previously, use TypeScript.',
      errors: [{ messageId: 'unresolved' }, { messageId: 'unresolved' }],
    },
    {
      code: 'Follow the above guidelines.',
      errors: [{ messageId: 'unresolved' }],
    },
  ],
})
