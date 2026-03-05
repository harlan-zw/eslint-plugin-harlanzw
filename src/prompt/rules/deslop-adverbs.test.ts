import { createPromptRuleTester } from '../_test'
import rule from './deslop-adverbs'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-adverbs', rule, {
  valid: [
    'This improves performance.',
    'The change reduces bundle size.',
    '```\nThis is significantly faster.\n```',
  ],
  invalid: [
    {
      code: 'This significantly improves performance.',
      errors: [{ messageId: 'adverb' }],
      output: 'This improves performance.',
    },
    {
      code: 'It fundamentally changes the architecture.',
      errors: [{ messageId: 'adverb' }],
      output: 'It changes the architecture.',
    },
    {
      code: 'This is essentially a wrapper.',
      errors: [{ messageId: 'adverb' }],
      output: 'This is a wrapper.',
    },
    {
      code: 'Performance dramatically improved.',
      errors: [{ messageId: 'adverb' }],
      output: 'Performance improved.',
    },
    // Capital preservation at sentence start
    {
      code: 'Essentially the build step is optional.',
      errors: [{ messageId: 'adverb' }],
      output: 'The build step is optional.',
    },
    // Capital preservation after list marker
    {
      code: '- Significantly reduces bundle size.',
      errors: [{ messageId: 'adverb' }],
      output: '- Reduces bundle size.',
    },
  ],
})
