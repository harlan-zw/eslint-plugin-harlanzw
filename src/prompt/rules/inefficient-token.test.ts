import { createPromptRuleTester } from '../_test'
import rule from './inefficient-token'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-inefficient-token', rule, {
  valid: [
    'Normal text here.',
    'Use HTTPS protocol.',
    '```\nAAAAAAAAAAAAAAAAAAAAAAAA\n```',
    'To do something.',
  ],
  invalid: [
    {
      code: 'Use AAAAAAAAAAAAAAAAAAAAAA identifiers.',
      errors: [{ messageId: 'inefficient' }],
    },
    {
      code: 'Reference 12345678901234567890.',
      errors: [{ messageId: 'inefficient' }],
    },
    {
      code: 'In order to do something.',
      errors: [{ messageId: 'verbose', data: { found: 'In order to', suggestion: 'To' } }],
      output: 'To do something.',
    },
    {
      code: 'Due to the fact that it failed.',
      errors: [{ messageId: 'verbose', data: { found: 'Due to the fact that', suggestion: 'Because' } }],
      output: 'Because it failed.',
    },
  ],
})
