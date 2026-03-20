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
    {
      code: 'It\'s not just a compliance requirement; it is the primary metadata for **Visual Search**.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: 'As of 2025, adhering to these best practices is no longer just about passing a Lightouse audit - it\'s about survival in an AI-driven search landscape.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
    {
      code: 'Developers add `loading="lazy"` to all images as a "best practice." It\'s not. It\'s a targeted optimization for specific images.',
      errors: [{ messageId: 'falseDichotomy' }],
    },
  ],
})
