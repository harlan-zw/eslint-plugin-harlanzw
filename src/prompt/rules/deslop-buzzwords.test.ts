import { createPromptRuleTester } from '../_test'
import rule from './deslop-buzzwords'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-buzzwords', rule, {
  valid: [
    'We use modern tools to build software.',
    'This is a strong framework.',
    '```\nLeverage the power of AI.\n```',
    'Explore the codebase.',
  ],
  invalid: [
    {
      code: 'We leverage TypeScript for type safety.',
      errors: [{ messageId: 'buzzword' }],
      output: 'We use TypeScript for type safety.',
    },
    {
      code: 'Let us delve into the details.',
      errors: [{ messageId: 'buzzword' }],
      output: 'Let us explore the details.',
    },
    {
      code: 'This is a cutting-edge solution.',
      errors: [{ messageId: 'buzzword' }],
      output: 'This is a modern solution.',
    },
    {
      code: 'This tool empowers developers.',
      errors: [{ messageId: 'buzzword' }],
      output: 'This tool helps developers.',
    },
    {
      code: 'Harness the power of reactive programming.',
      errors: [{ messageId: 'buzzword' }],
      output: 'Use reactive programming.',
    },
    {
      code: 'A seamless integration with your workflow.',
      errors: [{ messageId: 'buzzword' }],
      output: 'A smooth integration with your workflow.',
    },
    {
      code: 'Streamline your development process.',
      errors: [{ messageId: 'buzzword' }],
      output: 'Simplify your development process.',
    },
  ],
})
