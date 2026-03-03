import { createPromptRuleTester } from '../_test'
import rule from './skill-frontmatter-required'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-skill-frontmatter-required', rule, {
  valid: [
    '---\nname: my-skill\ndescription: A skill\n---\n# Hello',
    '---\nname: test\ndescription: Test skill\nlicense: MIT\n---',
  ],
  invalid: [
    {
      code: '# No frontmatter here',
      errors: [{ messageId: 'missingFrontmatter' }],
    },
    {
      code: '---\nname: my-skill\n---\n# Missing description',
      errors: [{ messageId: 'missingField', data: { field: 'description' } }],
    },
    {
      code: '---\ndescription: A skill\n---\n# Missing name',
      errors: [{ messageId: 'missingField', data: { field: 'name' } }],
    },
    {
      code: '---\nlicense: MIT\n---\n# Missing both',
      errors: [
        { messageId: 'missingField', data: { field: 'name' } },
        { messageId: 'missingField', data: { field: 'description' } },
      ],
    },
    {
      code: '--- unclosed frontmatter\nname: test',
      errors: [{ messageId: 'missingFrontmatter' }],
    },
  ],
})
