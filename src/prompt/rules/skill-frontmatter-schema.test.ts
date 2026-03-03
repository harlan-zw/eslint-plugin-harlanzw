import { createPromptRuleTester } from '../_test'
import rule from './skill-frontmatter-schema'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-skill-frontmatter-schema', rule, {
  valid: [
    '---\nname: my-skill\ndescription: A valid skill\n---',
    '---\nname: a1-b2-c3\ndescription: Test\nlicense: MIT\ncompatibility: For use with X\n---',
    '---\nname: skill\ndescription: Test\nallowed-tools: tool1\nmetadata: data\n---',
    '---\nname: my-skill\ndescription: A skill\nmetadata:\n  version: 1.0.0\n  generated_by: test\n---',
    '# No frontmatter',
  ],
  invalid: [
    {
      code: '---\nname: my-skill\nauthor: someone\ndescription: A skill\n---',
      errors: [{ messageId: 'unknownField', data: { field: 'author', allowed: 'name, description, license, allowed-tools, metadata, compatibility' } }],
      output: '---\nname: my-skill\ndescription: A skill\n---',
    },
    {
      code: '---\nname: MySkill\ndescription: A skill\n---',
      errors: [{ messageId: 'nameFormat' }],
    },
    {
      code: '---\nname: my skill\ndescription: A skill\n---',
      errors: [{ messageId: 'nameFormat' }],
    },
    {
      code: '---\nname: -my-skill\ndescription: A skill\n---',
      errors: [{ messageId: 'nameHyphens' }],
    },
    {
      code: '---\nname: my-skill-\ndescription: A skill\n---',
      errors: [{ messageId: 'nameHyphens' }],
    },
    {
      code: '---\nname: my--skill\ndescription: A skill\n---',
      errors: [{ messageId: 'nameHyphens' }],
    },
    {
      code: `---\nname: ${'a'.repeat(65)}\ndescription: A skill\n---`,
      errors: [{ messageId: 'nameLength', data: { max: '64', length: '65' } }],
    },
    {
      code: '---\nname: claude-helper\ndescription: A skill\n---',
      errors: [{ messageId: 'nameReserved', data: { term: 'claude' } }],
    },
    {
      code: '---\nname: anthropic-tools\ndescription: A skill\n---',
      errors: [{ messageId: 'nameReserved', data: { term: 'anthropic' } }],
    },
    {
      code: '---\nname: my-skill\ndescription: Use <tag> here\n---',
      errors: [{ messageId: 'frontmatterBrackets', data: { field: 'description' } }],
    },
    {
      code: `---\nname: my-skill\ndescription: ${'x'.repeat(1025)}\n---`,
      errors: [{ messageId: 'descriptionLength', data: { max: '1024', length: '1025' } }],
    },
    {
      code: `---\nname: my-skill\ndescription: ok\ncompatibility: ${'x'.repeat(501)}\n---`,
      errors: [{ messageId: 'compatibilityLength', data: { max: '500', length: '501' } }],
    },
    {
      code: '---\nname: my-skill\ndescription: ok\nlicense: <injected>\n---',
      errors: [{ messageId: 'frontmatterBrackets', data: { field: 'license' } }],
    },
  ],
})
