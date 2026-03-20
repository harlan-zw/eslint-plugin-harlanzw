import { createPromptRuleTester } from '../_test'
import rule from './deslop-frontmatter-spacing'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-frontmatter-spacing', rule, {
  valid: [
    // Clean frontmatter
    '---\ntitle: Hello\n---\n\nContent here.',
    // Multiple fields, no blanks
    '---\ntitle: Hello\ndescription: World\n---\n\nContent.',
    // No frontmatter at all
    'Just some content.',
    // Empty file
    '',
  ],
  invalid: [
    {
      // Blank line after opening ---
      code: '---\n\ntitle: Hello\n---',
      errors: [{ messageId: 'emptyLine' }],
      output: '---\ntitle: Hello\n---',
    },
    {
      // Blank line before closing ---
      code: '---\ntitle: Hello\n\n---',
      errors: [{ messageId: 'emptyLine' }],
      output: '---\ntitle: Hello\n---',
    },
    {
      // Blank lines on both sides
      code: '---\n\ntitle: Hello\n\n---',
      errors: [{ messageId: 'emptyLine' }, { messageId: 'emptyLine' }],
      output: '---\ntitle: Hello\n---',
    },
    {
      // Blank line between fields
      code: '---\ntitle: Hello\n\ndescription: World\n---',
      errors: [{ messageId: 'emptyLine' }],
      output: '---\ntitle: Hello\ndescription: World\n---',
    },
  ],
})
