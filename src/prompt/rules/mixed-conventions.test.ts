import { createPromptRuleTester } from '../_test'
import rule from './mixed-conventions'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-mixed-conventions', rule, {
  valid: [
    '# Heading\n\nSome content.',
    '<instructions>\nDo things.\n</instructions>',
    '# Heading\n\n```xml\n<tag>inside code</tag>\n```',
  ],
  invalid: [
    {
      code: '# Heading\n\n<instructions>\nDo things.\n</instructions>',
      errors: [{ messageId: 'mixed' }],
    },
  ],
})
