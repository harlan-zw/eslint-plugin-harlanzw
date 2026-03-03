import { createPromptRuleTester } from '../_test'
import rule from './empty-section'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-empty-section', rule, {
  valid: [
    '## Setup\n\nInstall the package.\n\n## Usage',
    '# Title\n\nIntro text.\n\n## Section\n\nMore text.',
    '## Only heading\n\nContent here.',
    '## Code\n\n```js\nconst x = 1\n```\n\n## Next',
  ],
  invalid: [
    {
      code: '## Setup\n\n## Usage\n\nDo things.',
      errors: [{ messageId: 'empty', data: { heading: 'Setup' } }],
    },
    {
      code: '## First\n## Second\n## Third\n\nContent.',
      errors: [
        { messageId: 'empty', data: { heading: 'First' } },
        { messageId: 'empty', data: { heading: 'Second' } },
      ],
    },
    {
      code: '# Title\n\n## Empty\n\n\n\n## Has Content\n\nText here.',
      errors: [
        { messageId: 'empty', data: { heading: 'Title' } },
        { messageId: 'empty', data: { heading: 'Empty' } },
      ],
    },
  ],
})
