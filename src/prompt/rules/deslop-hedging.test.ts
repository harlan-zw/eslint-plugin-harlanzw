import { createPromptRuleTester } from '../_test'
import rule from './deslop-hedging'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-hedging', rule, {
  valid: [
    'This improves performance.',
    'The API handles requests.',
    '```\nThis is very fast.\n```',
    'Use the `quite` option for filtering.',
  ],
  invalid: [
    {
      code: 'This is very fast.',
      errors: [{ messageId: 'hedging' }],
      output: 'This is fast.',
    },
    {
      code: 'It is really important to test.',
      errors: [{ messageId: 'hedging' }],
      output: 'It is important to test.',
    },
    {
      code: 'The API is quite stable.',
      errors: [{ messageId: 'hedging' }],
      output: 'The API is stable.',
    },
    {
      code: 'Performance is somewhat better.',
      errors: [{ messageId: 'hedging' }],
      output: 'Performance is better.',
    },
    {
      code: 'This is fairly common in production.',
      errors: [{ messageId: 'hedging' }],
      output: 'This is common in production.',
    },
    {
      code: 'It just works out of the box.',
      errors: [{ messageId: 'hedging' }],
      output: 'It works out of the box.',
    },
  ],
})
