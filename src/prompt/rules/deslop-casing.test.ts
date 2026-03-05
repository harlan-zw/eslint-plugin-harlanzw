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
  ],
})
