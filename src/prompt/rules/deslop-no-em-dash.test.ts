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
    // === Single em dash ===
    {
      code: 'This is great — really great.',
      errors: [{ messageId: 'emDash' }],
    },
    {
      code: 'First—second',
      errors: [{ messageId: 'emDash' }],
    },
    {
      code: 'One— two',
      errors: [{ messageId: 'emDash' }],
    },
    {
      code: 'One —two',
      errors: [{ messageId: 'emDash' }],
    },

    // === Paired em dashes (parenthetical) ===
    {
      code: 'TypeScript — a typed language — is great.',
      errors: [{ messageId: 'emDash' }, { messageId: 'emDash' }],
    },
    {
      code: 'The tool—built in Rust—is fast.',
      errors: [{ messageId: 'emDash' }, { messageId: 'emDash' }],
    },
    {
      code: 'Nuxt — the Vue framework — ships SSR by default.',
      errors: [{ messageId: 'emDash' }, { messageId: 'emDash' }],
    },

    // === Label/title pattern ===
    {
      code: '**Performance** — how to make it fast.',
      errors: [{ messageId: 'emDash' }],
    },
    {
      code: '- **SSR** — server-side rendering for Nuxt apps.',
      errors: [{ messageId: 'emDash' }],
    },
    {
      code: '**Build tools**—bundlers and transpilers.',
      errors: [{ messageId: 'emDash' }],
    },

    // === Three or more em dashes ===
    {
      code: 'A — B — C — D',
      errors: [{ messageId: 'emDash' }, { messageId: 'emDash' }, { messageId: 'emDash' }],
    },

    // === Edge: bold text with paired em dashes ===
    {
      code: 'The **framework** — built by Evan — is popular.',
      errors: [{ messageId: 'emDash' }, { messageId: 'emDash' }],
    },
  ],
})

ruleTester.run('harlanzw/ai-deslop-no-em-dash with spaced hyphens', rule, {
  valid: [
    { code: 'Check the docs - they explain it.', options: [{ checkSpacedHyphens: false }] },
    ...[
      '- Read the docs.',
      '  - Read the docs.',
      '---',
      'Use a well-tested library.',
      'The range is 10 - 20.',
      'Subtract 10 - count.',
      '```md\nRead the docs - they explain it.\n```',
      '~~~md\nRead the docs - they explain it.\n~~~',
      '`Read the docs - they explain it.`',
      '[docs](https://example.com/read - docs)',
      '---\ntitle: Read the docs - they explain it.\n---\nRead the docs.',
    ].map(code => ({ code, options: [{ checkSpacedHyphens: true }] })),
  ],
  invalid: [
    {
      code: 'Check the docs - they explain it.',
      options: [{ checkSpacedHyphens: true }],
      errors: [{ messageId: 'spacedHyphen', line: 1, column: 16, endColumn: 17 }],
    },
    {
      code: '- Read the docs - they explain it.',
      options: [{ checkSpacedHyphens: true }],
      errors: [{ messageId: 'spacedHyphen' }],
    },
    {
      code: 'First - second - third.',
      options: [{ checkSpacedHyphens: true }],
      errors: [{ messageId: 'spacedHyphen' }, { messageId: 'spacedHyphen' }],
    },
    {
      code: 'Read the docs — then test - then ship.',
      options: [{ checkSpacedHyphens: true }],
      errors: [{ messageId: 'emDash' }, { messageId: 'spacedHyphen' }],
    },
    {
      code: '[Read the docs - they explain it.](https://example.com)',
      options: [{ checkSpacedHyphens: true }],
      errors: [{ messageId: 'spacedHyphen' }],
    },
    {
      code: 'Lisez les détails - ça aide.',
      options: [{ checkSpacedHyphens: true }],
      errors: [{ messageId: 'spacedHyphen' }],
    },
  ],
})
