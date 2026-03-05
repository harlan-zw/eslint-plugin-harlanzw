import { createPromptRuleTester } from '../_test'
import rule from './deslop-passive-voice'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-passive-voice', rule, {
  valid: [
    'Nuxt generates the pages automatically.',
    'The server handles requests.',
    'We deploy the application to production.',
    '```\nFiles are generated in the dist folder.\n```',
    'The build option configures the output.',
  ],
  invalid: [
    {
      code: 'Reports are generated every hour.',
      errors: [{ messageId: 'passive' }],
    },
    {
      code: 'The files were created by the build tool.',
      errors: [{ messageId: 'passive' }],
    },
    {
      code: 'Components are rendered on the server.',
      errors: [{ messageId: 'passive' }],
    },
    {
      code: 'The data is automatically fetched from the API.',
      errors: [{ messageId: 'passive' }],
    },
    {
      code: 'Errors are logged and events are tracked.',
      errors: [{ messageId: 'passive' }, { messageId: 'passive' }],
    },
  ],
})
