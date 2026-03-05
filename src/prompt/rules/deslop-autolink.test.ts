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
    // Inside link URL — do not auto-link terms found in URLs
    'Check [Unhead](https://unhead.unjs.io/) for details.',
    // Inside link text — do not nest links
    'Use [Nuxt and Vue](https://example.com) together.',
    // Inside inline code
    'Run `Nuxt` in dev mode.',
    // Term already linked with different text
    'Use [the framework](https://nuxt.com) for SSR.',
    // Compound name — next word capitalized (e.g. "Nuxt SEO")
    'Nuxt SEO is a great module.',
    'Use Nuxt UI for components.',
    // Already linked on a previous line (pre-scan catches it)
    '[Nuxt](https://nuxt.com) is great.\nNuxt is also fast.',
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
