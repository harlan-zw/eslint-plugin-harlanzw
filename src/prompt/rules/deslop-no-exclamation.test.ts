import { createPromptRuleTester } from '../_test'
import rule from './deslop-no-exclamation'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-no-exclamation', rule, {
  valid: [
    'This is a great feature.',
    'Performance improved by 50%.',
    '![image](logo.png)',
    '```\nAlert! Something happened!\n```',
    '![image](logo.png) is valid markdown.',
  ],
  invalid: [
    {
      code: 'This is amazing!',
      errors: [{ messageId: 'exclamation' }],
      output: 'This is amazing.',
    },
    {
      code: 'Check out this feature! It works great!',
      errors: [{ messageId: 'exclamation' }, { messageId: 'exclamation' }],
      output: 'Check out this feature. It works great.',
    },
    {
      code: 'Welcome to Nuxt!',
      errors: [{ messageId: 'exclamation' }],
      output: 'Welcome to Nuxt.',
    },
  ],
})
