import { createPromptRuleTester } from '../_test'
import rule from './deslop-weak-opener'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-weak-opener', rule, {
  valid: [
    'Nuxt provides server-side rendering.',
    'Use the composable for reactive state.',
    '```\nThere is a bug in the code.\n```',
    'Check if there is an error in the response.',
  ],
  invalid: [
    {
      code: 'There is a built-in composable for this.',
      errors: [{ messageId: 'weakOpener' }],
    },
    {
      code: 'There are several ways to handle this.',
      errors: [{ messageId: 'weakOpener' }],
    },
    {
      code: 'It is important to validate the input.',
      errors: [{ messageId: 'weakOpener' }],
    },
    {
      code: 'It is possible to override the defaults.',
      errors: [{ messageId: 'weakOpener' }],
    },
    {
      code: '- There is a config option for this.',
      errors: [{ messageId: 'weakOpener' }],
    },
  ],
})
