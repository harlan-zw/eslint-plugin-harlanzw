import { createPromptRuleTester } from '../_test'
import rule from './deslop-no-em-dash'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-no-em-dash', rule, {
  valid: [
    'This is a normal sentence.',
    'Use a plain - dash instead.',
    'Check the docs - they explain it.',
    '```\ncode — with em dash\n```',
    'Visit [link](https://example.com/path—thing) for details.',
  ],
  invalid: [
    {
      code: 'This is great — really great.',
      errors: [{ messageId: 'emDash' }],
      output: 'This is great - really great.',
    },
    {
      code: 'First—second',
      errors: [{ messageId: 'emDash' }],
      output: 'First - second',
    },
    {
      code: 'One— two',
      errors: [{ messageId: 'emDash' }],
      output: 'One - two',
    },
    {
      code: 'One —two',
      errors: [{ messageId: 'emDash' }],
      output: 'One - two',
    },
    {
      code: 'A — B — C',
      errors: [{ messageId: 'emDash' }, { messageId: 'emDash' }],
      output: 'A - B - C',
    },
  ],
})
