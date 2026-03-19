import { createPromptRuleTester } from '../_test'
import rule from './deslop-false-dichotomy'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-false-dichotomy', rule, {
  valid: [
    'Nuxt provides server-side rendering.',
    'Make sure it\'s not null before proceeding.',
    'Check that it\'s working correctly.',
    '```\nIt\'s not a bug — it\'s a feature.\n```',
    'The value is not zero.',
  ],
  invalid: [
    {
      code: 'It\'s not a framework — it\'s a compiler.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: 'it\'s not about speed, it\'s about correctness.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: 'It\'s not just a library; it\'s a paradigm shift.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: '- It\'s not complexity — it\'s power.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
  ],
})
