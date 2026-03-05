import { createPromptRuleTester } from '../_test'
import rule from './deslop-autolink'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-autolink', rule, {
  valid: [
    // Already linked
    'Use [Nuxt](https://nuxt.com) for your project.',
    // Inside code block
    '```\nNuxt is great\n```',
    // Inside inline code
    'Use `Nuxt` for SSR.',
    // In heading (skip headings)
    '# Using Nuxt for SSR',
    '## TypeScript Support',
  ],
  invalid: [
    {
      code: 'Nuxt is a great framework.',
      errors: [{ messageId: 'autolink', data: { name: 'Nuxt', url: 'https://nuxt.com' } }],
      output: '[Nuxt](https://nuxt.com) is a great framework.',
    },
    {
      code: 'Use TypeScript for type safety.',
      errors: [{ messageId: 'autolink', data: { name: 'TypeScript', url: 'https://typescriptlang.org' } }],
      output: 'Use [TypeScript](https://typescriptlang.org) for type safety.',
    },
    {
      code: 'Deploy to GitHub easily.',
      errors: [{ messageId: 'autolink', data: { name: 'GitHub', url: 'https://github.com' } }],
      output: 'Deploy to [GitHub](https://github.com) easily.',
    },
    {
      // Only first occurrence gets linked
      code: 'Nuxt is fast. Nuxt is also easy.',
      errors: [{ messageId: 'autolink' }],
      output: '[Nuxt](https://nuxt.com) is fast. Nuxt is also easy.',
    },
  ],
})
