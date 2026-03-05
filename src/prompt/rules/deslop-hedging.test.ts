import { createPromptRuleTester } from '../_test'
import rule from './deslop-hedging'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-hedging', rule, {
  valid: [
    'This improves performance.',
    'The API handles requests.',
    '```\nThis is very fast.\n```',
    'Use the `quite` option for filtering.',
    // "rather than" is a valid comparative, not hedging
    'Use hyphens rather than underscores.',
    'Deploy within minutes rather than hours.',
    // "not just" preserves contrast meaning
    'It\'s not just about search engines.',
    'SEO isn\'t just about keywords.',
    // "no longer just" — removing "just" reverses meaning
    'It\'s no longer just about blue links.',
    'You are no longer just optimizing for human users.',
    // "more than just" — removing "just" changes meaning
    'It\'s more than just a timestamp.',
    // "rather than just" — removing "just" changes meaning
    'Search engines now index entities rather than just keywords.',
  ],
  invalid: [
    {
      code: 'This is very fast.',
      errors: [{ messageId: 'hedging' }],
      output: 'This is fast.',
    },
    {
      code: 'It is really important to test.',
      errors: [{ messageId: 'hedging' }],
      output: 'It is important to test.',
    },
    {
      code: 'The API is quite stable.',
      errors: [{ messageId: 'hedging' }],
      output: 'The API is stable.',
    },
    {
      code: 'Performance is somewhat better.',
      errors: [{ messageId: 'hedging' }],
      output: 'Performance is better.',
    },
    {
      code: 'This is fairly common in production.',
      errors: [{ messageId: 'hedging' }],
      output: 'This is common in production.',
    },
    {
      code: 'It just works out of the box.',
      errors: [{ messageId: 'hedging' }],
      output: 'It works out of the box.',
    },
    // Capital preservation at sentence start
    {
      code: 'Just write the tests first.',
      errors: [{ messageId: 'hedging' }],
      output: 'Write the tests first.',
    },
    // Capital preservation after list marker
    {
      code: '- Just use the default config.',
      errors: [{ messageId: 'hedging' }],
      output: '- Use the default config.',
    },
  ],
})
