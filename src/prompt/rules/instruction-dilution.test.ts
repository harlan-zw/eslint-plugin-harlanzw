import { createPromptRuleTester } from '../_test'
import rule from './instruction-dilution'

const ruleTester = createPromptRuleTester()

const fewConstraints = Array.from({ length: 5 }, (_, i) => `Must do thing ${i}`).join('\n')
const manyConstraints = Array.from({ length: 20 }, (_, i) => `Must do thing ${i}`).join('\n')

ruleTester.run('harlanzw/prompt-instruction-dilution', rule, {
  valid: [
    fewConstraints,
    {
      code: manyConstraints,
      options: [{ maxConstraints: 25 }],
    },
  ],
  invalid: [
    {
      code: manyConstraints,
      errors: [{ messageId: 'dilution' }],
    },
    {
      code: Array.from({ length: 5 }, (_, i) => `Always do thing ${i}`).join('\n'),
      options: [{ maxConstraints: 3 }],
      errors: [{ messageId: 'dilution' }],
    },
  ],
})
