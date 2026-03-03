import { createPromptRuleTester } from '../_test'
import rule from './unclosed-code-fence'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-unclosed-code-fence', rule, {
  valid: [
    'No code blocks here.',
    '```js\nconst x = 1\n```',
    '```\nblock 1\n```\n\n```\nblock 2\n```',
    '---\ntitle: Test\n---\n\nContent here.',
  ],
  invalid: [
    {
      code: '```js\nconst x = 1\nmore stuff',
      errors: [{ messageId: 'unclosed', data: { line: '1' } }],
      output: '```js\nconst x = 1\nmore stuff\n```',
    },
    {
      code: 'Some text\n\n```python\ndef foo():\n  pass',
      errors: [{ messageId: 'unclosed', data: { line: '3' } }],
      output: 'Some text\n\n```python\ndef foo():\n  pass\n```',
    },
    {
      code: '```\nblock 1\n```\n\n```\nblock 2 unclosed',
      errors: [{ messageId: 'unclosed', data: { line: '5' } }],
      output: '```\nblock 1\n```\n\n```\nblock 2 unclosed\n```',
    },
  ],
})
