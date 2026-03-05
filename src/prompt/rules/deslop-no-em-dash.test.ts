import { createPromptRuleTester } from '../_test'
import rule from './deslop-no-em-dash'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-no-em-dash', rule, {
  valid: [
    'This is a normal sentence.',
    'Use a plain - dash instead.',
    'Check the docs - they explain it.',
    '```\ncode — with em dash\n```',
    'Visit [link](https://example.com/path—thing) for details.',
  ],
  invalid: [
    // === Single em dash: replace with " - " ===
    {
      code: 'This is great — really great.',
      errors: [{ messageId: 'emDash' }],
      output: 'This is great - really great.',
    },
    {
      code: 'First—second',
      errors: [{ messageId: 'emDash' }],
      output: 'First - second',
    },
    {
      code: 'One— two',
      errors: [{ messageId: 'emDash' }],
      output: 'One - two',
    },
    {
      code: 'One —two',
      errors: [{ messageId: 'emDash' }],
      output: 'One - two',
    },

    // === Paired em dashes (parenthetical): replace with commas ===
    {
      code: 'TypeScript — a typed language — is great.',
      errors: [{ messageId: 'emDashParen' }, { messageId: 'emDashParen' }],
      output: 'TypeScript, a typed language, is great.',
    },
    {
      code: 'The tool—built in Rust—is fast.',
      errors: [{ messageId: 'emDashParen' }, { messageId: 'emDashParen' }],
      output: 'The tool, built in Rust, is fast.',
    },
    {
      code: 'Nuxt — the Vue framework — ships SSR by default.',
      errors: [{ messageId: 'emDashParen' }, { messageId: 'emDashParen' }],
      output: 'Nuxt, the Vue framework, ships SSR by default.',
    },

    // === Label/title pattern: replace with colon ===
    {
      code: '**Performance** — how to make it fast.',
      errors: [{ messageId: 'emDashColon' }],
      output: '**Performance**: how to make it fast.',
    },
    {
      code: '- **SSR** — server-side rendering for Nuxt apps.',
      errors: [{ messageId: 'emDashColon' }],
      output: '- **SSR**: server-side rendering for Nuxt apps.',
    },
    {
      code: '**Build tools**—bundlers and transpilers.',
      errors: [{ messageId: 'emDashColon' }],
      output: '**Build tools**: bundlers and transpilers.',
    },

    // === Three or more em dashes: not a pair, use dashes ===
    {
      code: 'A — B — C — D',
      errors: [{ messageId: 'emDash' }, { messageId: 'emDash' }, { messageId: 'emDash' }],
      output: 'A - B - C - D',
    },

    // === Edge: bold text with paired em dashes is parenthetical, not label ===
    {
      code: 'The **framework** — built by Evan — is popular.',
      errors: [{ messageId: 'emDashParen' }, { messageId: 'emDashParen' }],
      output: 'The **framework**, built by Evan, is popular.',
    },
  ],
})
