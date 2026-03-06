import { createPromptRuleTester } from '../_test'
import rule from './deslop-code-lang'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-code-lang', rule, {
  valid: [
    // Already has lang tag
    'Use `useSeoMeta()`{lang="ts"} in your component.',
    'Use `<title>`{lang="html"} for the page title.',
    // No matching ending character
    'Use `foo` for bar.',
    'The `config` option is important.',
    // Inside code blocks — skipped
    '```\n`useSeoMeta()`\n```',
    // Empty inline code
    '``',
    // Code block with non-matching content
    'Set `enabled` to true.',
  ],
  invalid: [
    {
      code: 'Use `useSeoMeta()` in your component.',
      errors: [{ messageId: 'missingLang', data: { code: 'useSeoMeta()', lang: 'ts' } }],
      output: 'Use `useSeoMeta()`{lang="ts"} in your component.',
    },
    {
      code: 'Use `useHead()` or `useSeoMeta()` in any component.',
      errors: [
        { messageId: 'missingLang', data: { code: 'useHead()', lang: 'ts' } },
        { messageId: 'missingLang', data: { code: 'useSeoMeta()', lang: 'ts' } },
      ],
      output: 'Use `useHead()`{lang="ts"} or `useSeoMeta()`{lang="ts"} in any component.',
    },
    {
      code: 'The `<title>` element sets the page title.',
      errors: [{ messageId: 'missingLang', data: { code: '<title>', lang: 'html' } }],
      output: 'The `<title>`{lang="html"} element sets the page title.',
    },
    {
      code: 'Use `<meta>` and `<link>` tags.',
      errors: [
        { messageId: 'missingLang', data: { code: '<meta>', lang: 'html' } },
        { messageId: 'missingLang', data: { code: '<link>', lang: 'html' } },
      ],
      output: 'Use `<meta>`{lang="html"} and `<link>`{lang="html"} tags.',
    },
    {
      code: 'Call `navigateTo()` to redirect.',
      errors: [{ messageId: 'missingLang', data: { code: 'navigateTo()', lang: 'ts' } }],
      output: 'Call `navigateTo()`{lang="ts"} to redirect.',
    },
    {
      code: '[`useScriptGoogleAdsense()`](/scripts/google-adsense) composable.',
      errors: [{ messageId: 'missingLang', data: { code: 'useScriptGoogleAdsense()', lang: 'ts' } }],
      output: '[`useScriptGoogleAdsense()`{lang="ts"}](/scripts/google-adsense) composable.',
    },
  ],
})
