import { createPromptRuleTester } from '../_test'
import rule from './deslop-filler'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-filler', rule, {
  valid: [
    'Vue 3 introduced the Composition API.',
    'Performance matters for user experience.',
    '```\nIt\'s worth noting that this is code.\n```',
  ],
  invalid: [
    {
      code: 'It\'s worth noting that Vue is fast.',
      errors: [{ messageId: 'filler' }],
      output: 'Vue is fast.',
    },
    {
      code: 'In today\'s world, performance matters.',
      errors: [{ messageId: 'filler' }],
      output: 'Performance matters.',
    },
    {
      code: 'When it comes to performance, Vue excels.',
      errors: [{ messageId: 'filler' }],
      output: 'Performance, Vue excels.',
    },
    {
      code: 'Needless to say, testing is important.',
      errors: [{ messageId: 'filler' }],
      output: 'Testing is important.',
    },
  ],
})
