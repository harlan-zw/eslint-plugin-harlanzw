import { createPromptRuleTester } from '../_test'
import rule from './duplicate-heading'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-duplicate-heading', rule, {
  valid: [
    '# First\n\n## Second\n\n## Third',
    '## Setup\n\n## Usage\n\n## API',
    '# Title\n\nContent here.',
    '## Examples\n\n```\n## Examples\n```',
  ],
  invalid: [
    {
      code: '## Examples\n\nSome content.\n\n## Examples',
      errors: [{ messageId: 'duplicate', data: { heading: 'Examples' } }],
    },
    {
      code: '# Setup\n\nDo this.\n\n# Setup\n\nDo that.\n\n# Setup',
      errors: [
        { messageId: 'duplicate', data: { heading: 'Setup' } },
        { messageId: 'duplicate', data: { heading: 'Setup' } },
      ],
    },
    {
      code: '## rules\n\nContent.\n\n## Rules',
      errors: [{ messageId: 'duplicate', data: { heading: 'Rules' } }],
    },
  ],
})
