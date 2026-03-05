import { createPromptRuleTester } from '../_test'
import rule from './deslop-casing'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-casing', rule, {
  valid: [
    'Use TypeScript for type safety.',
    'Deploy to GitHub.',
    'Build with webpack.',
    'The API is RESTful.',
    'Use VS Code for development.',
    '```\njavascript is great\n```',
    'Node.js is a runtime.',
    // Inside link URL — do not modify
    'Check [the docs](https://github.com/nuxt/nuxt) for details.',
    'Read the [ESLint guide](https://eslint.org/docs/latest).',
    // Inside inline code — do not modify
    'Run `npm install typescript` to install.',
    // Inside non-prose boundaries — do not modify
    '`<title>`{lang="html"}',
    '{lang="html"}',
    'key="javascript"',
    // Compound identifiers — do not modify
    'Install nuxt-seo for SEO support.',
    'Generate a sitemap.xml file.',
    'Create an index.html page.',
    'Use vite-ssg for static sites.',
    'Use https://example.com for testing.',
    ':github-repo-card{repo="nuxt"}',
    // Attribute-like contexts — do not modify
    '::install-button{url="/mcp" ide="cursor"}',
    'Set the url="/api" parameter.',
    // Underscore compound identifiers — do not modify
    'The SEO_audit_site function runs daily.',
    // Slash compound identifiers — do not modify (scoped packages)
    'Install @nuxtjs/seo for SEO support.',
    'The @nuxtjs/seo module is great.',
    // Scoped packages with @ prefix
    '@nuxtjs/sitemap is available.',
  ],
  invalid: [
    {
      code: 'Use typescript for type safety.',
      errors: [{ messageId: 'casing', data: { found: 'typescript', correct: 'TypeScript' } }],
      output: 'Use TypeScript for type safety.',
    },
    {
      code: 'Deploy to Github.',
      errors: [{ messageId: 'casing', data: { found: 'Github', correct: 'GitHub' } }],
      output: 'Deploy to GitHub.',
    },
    {
      code: 'Use Webpack to bundle.',
      errors: [{ messageId: 'casing', data: { found: 'Webpack', correct: 'webpack' } }],
      output: 'Use webpack to bundle.',
    },
    {
      code: 'The api is restful.',
      errors: [
        { messageId: 'casing', data: { found: 'api', correct: 'API' } },
        { messageId: 'casing', data: { found: 'restful', correct: 'RESTful' } },
      ],
      output: 'The API is RESTful.',
    },
    {
      code: 'Use VsCode for editing.',
      errors: [{ messageId: 'casing', data: { found: 'VsCode', correct: 'VS Code' } }],
      output: 'Use VS Code for editing.',
    },
    {
      code: 'Build with Esbuild.',
      errors: [{ messageId: 'casing', data: { found: 'Esbuild', correct: 'esbuild' } }],
      output: 'Build with esbuild.',
    },
    {
      code: 'MacOS is an operating system.',
      errors: [{ messageId: 'casing', data: { found: 'MacOS', correct: 'macOS' } }],
      output: 'macOS is an operating system.',
    },
    {
      // Fix casing in link text but not in URL
      code: 'Use [github](https://github.com) for hosting.',
      errors: [{ messageId: 'casing', data: { found: 'github', correct: 'GitHub' } }],
      output: 'Use [GitHub](https://github.com) for hosting.',
    },
  ],
})
