import { createPromptRuleTester } from '../_test'
import rule from './deslop-false-sincerity'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-false-sincerity', rule, {
  valid: [
    'This improves performance.',
    'The API handles requests.',
    // not an opener — mid-sentence usage of "honestly" is fine
    'Answer the survey honestly.',
    'Rate the talk honestly and fairly.',
    // inside code block
    '```\nhonestly, this is fine\n```',
    // inside inline code
    'Use the `frankly` flag here.',
  ],
  invalid: [
    {
      code: 'Honestly, this is the fastest option.',
      errors: [{ messageId: 'falseSincerity' }],
      output: 'This is the fastest option.',
    },
    {
      code: 'Frankly, the docs need work.',
      errors: [{ messageId: 'falseSincerity' }],
      output: 'The docs need work.',
    },
    {
      code: 'In all honesty, the migration was painful.',
      errors: [{ messageId: 'falseSincerity' }],
      output: 'The migration was painful.',
    },
    {
      code: 'Let\'s be real, nobody reads the changelog.',
      errors: [{ messageId: 'falseSincerity' }],
      output: 'Nobody reads the changelog.',
    },
    // after a list marker
    {
      code: '- Honestly, just ship it.',
      errors: [{ messageId: 'falseSincerity' }],
      output: '- Just ship it.',
    },
    // after a sentence boundary
    {
      code: 'It works. Frankly, it always has.',
      errors: [{ messageId: 'falseSincerity' }],
      output: 'It works. It always has.',
    },
  ],
})
