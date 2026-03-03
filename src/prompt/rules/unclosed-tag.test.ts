import { createPromptRuleTester } from '../_test'
import rule from './unclosed-tag'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-unclosed-tag', rule, {
  valid: [
    '<instructions>\nDo things.\n</instructions>',
    'No tags here.',
    '<a>\n</a>\n<b>\n</b>',
  ],
  invalid: [
    {
      code: '<instructions>\nDo things.',
      errors: [{ messageId: 'unclosed', data: { tag: 'instructions', openCount: '1', closeCount: '0' } }],
      output: '<instructions>\nDo things.\n</instructions>',
    },
    {
      code: '<foo>\n<foo>\n</foo>',
      errors: [{ messageId: 'unclosed', data: { tag: 'foo', openCount: '2', closeCount: '1' } }],
      output: '<foo>\n<foo>\n</foo>\n</foo>',
    },
  ],
})
