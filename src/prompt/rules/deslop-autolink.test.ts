import { createPromptRuleTester } from '../_test'
import rule from './deslop-autolink'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-autolink', rule, {
  valid: [
    // Already linked
    'Use [Vue](https://vuejs.org) for your project.',
    // Inside code block
    '```\nVue is great\n```',
    // Inside inline code
    'Use `Vue` for SSR.',
    // In heading (skip headings)
    '# Using Vue for SSR',
    '## TypeScript Support',
    // Inside link URL — do not auto-link terms found in URLs
    'Check [Unhead](https://unhead.unjs.io/) for details.',
    // Inside link text — do not nest links
    'Use [Vue and React](https://example.com) together.',
    // Inside inline code
    'Run `Vue` in dev mode.',
    // Term already linked with different text
    'Use [the framework](https://vuejs.org) for SSR.',
    // Component shorthand — do not break
    ':GitHub-repo-card{repo="nuxt"}',
    // Hyphenated compounds — do not break
    'Use nuxt-ESLint for linting.',
    // Dot-suffixed names — do not break (Vue.js, Node.js)
    'Vue.js is a framework.',
    // Already linked on a previous line (pre-scan catches it)
    '[Vue](https://vuejs.org) is great.\nVue is also fast.',
    // MDC component lines — do not autolink inside component attributes
    ':YouTubeVideo{videoId="OyVI8zmDqWU" title="[Vue](https://vuejs.org) 3 (intro to Vue)"}',
    '::card{title="Using Vue for SSR"}',
  ],
  invalid: [
    {
      code: 'Use Vitest for testing.',
      errors: [{ messageId: 'autolink', data: { name: 'Vitest', url: 'https://vitest.dev' } }],
      output: 'Use [Vitest](https://vitest.dev) for testing.',
    },
    {
      code: 'Deploy to GitHub easily.',
      errors: [{ messageId: 'autolink', data: { name: 'GitHub', url: 'https://github.com' } }],
      output: 'Deploy to [GitHub](https://github.com) easily.',
    },
    {
      // Only first occurrence gets linked
      code: 'Vitest is fast. Vitest is also easy.',
      errors: [{ messageId: 'autolink' }],
      output: '[Vitest](https://vitest.dev) is fast. Vitest is also easy.',
    },
  ],
})
