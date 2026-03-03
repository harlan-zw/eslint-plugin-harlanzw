import { createPromptRuleTester } from '../_test'
import rule from './missing-examples'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-missing-examples', rule, {
  valid: [
    'Return a greeting.',
    'Output JSON format.\n\nExample:\n```json\n{"key": "value"}\n```',
    'Use TypeScript.',
  ],
  invalid: [
    {
      code: 'Return the output as a JSON object.\nThe response should include all fields.',
      errors: [{ messageId: 'missing' }],
    },
  ],
})
