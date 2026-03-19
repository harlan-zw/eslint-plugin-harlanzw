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
    // Inline placeholder tags (not on their own line) should be ignored
    'Replace <name> with your value and <type> with the type.',
    'Use <number> as the id and <slug> as the path.',
    'The format is <prefix>-<suffix> for all entries.',
    // Self-closing style single tags inline - no structural usage
    'Set the <value> parameter to configure it.',
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
    // Structural tag on own line but missing close
    {
      code: '<context>\nSome context here.\nMore stuff.',
      errors: [{ messageId: 'unclosed', data: { tag: 'context', openCount: '1', closeCount: '0' } }],
    },
    // Mixed: structural tag + inline usage of same tag name - all occurrences counted
    {
      code: '<example>\nUse <example> as a reference.\n</example>',
      errors: [{ messageId: 'unclosed', data: { tag: 'example', openCount: '2', closeCount: '1' } }],
    },
  ],
})
