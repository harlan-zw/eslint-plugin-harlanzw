import { createPromptRuleTester } from '../_test'
import rule from './unclosed-tag'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-unclosed-tag', rule, {
  valid: [
    '<instructions>\nDo things.\n</instructions>',
    'No tags here.',
    '<a>\n</a>\n<b>\n</b>',
    // Tags inside inline code should be ignored
    'Where `<slug>` is a kebab-case short title.',
    'Use `<number>` and `<name>` as placeholders.',
    'Run `wt switch --create fix/<number>-<slug>` to create a worktree.',
  ],
  invalid: [
    {
      code: '<instructions>\nDo things.',
      errors: [{ messageId: 'unclosed', data: { tag: 'instructions', openCount: '1', closeCount: '0' } }],
    },
    {
      code: '<foo>\n<foo>\n</foo>',
      errors: [{ messageId: 'unclosed', data: { tag: 'foo', openCount: '2', closeCount: '1' } }],
    },
  ],
})
