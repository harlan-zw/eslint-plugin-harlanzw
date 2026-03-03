import { createPromptRuleTester } from '../_test'
import rule from './example-mismatch'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-example-mismatch', rule, {
  valid: [
    'Input: hello\nOutput: world\nInput: foo\nOutput: bar',
    'No examples here.',
  ],
  invalid: [
    {
      code: 'Input: hello\nOutput: world\nInput: foo',
      errors: [{ messageId: 'mismatch', data: { inputCount: '2', outputCount: '1' } }],
    },
  ],
})
