import { createPromptRuleTester } from '../_test'
import rule from './redundant-instruction'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/prompt-redundant-instruction', rule, {
  valid: [
    'Must use TypeScript.\nMust add tests.',
    'Always use functional code.',
  ],
  invalid: [
    {
      code: 'Must use TypeScript for all files.\nOther text.\nMust use TypeScript for all files.',
      errors: [{ messageId: 'redundant' }],
      output: 'Must use TypeScript for all files.\nOther text.',
    },
  ],
})
