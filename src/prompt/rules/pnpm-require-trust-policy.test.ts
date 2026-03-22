import { createPromptRuleTester } from '../_test'
import rule from './pnpm-require-trust-policy'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/pnpm-require-trust-policy', rule, {
  valid: [
    // Already has the correct value
    'packages:\n  - packages/*\ntrustPolicyIgnoreAfter: 262800',
    // Just the key
    'trustPolicyIgnoreAfter: 262800',
    // With other content around it
    'catalog:\n  vue: ^3.5.0\ntrustPolicyIgnoreAfter: 262800\nonlyBuiltDependencies:\n  - esbuild',
  ],
  invalid: [
    {
      // Missing entirely
      code: 'packages:\n  - packages/*',
      errors: [{ messageId: 'missing' }],
      output: 'packages:\n  - packages/*\ntrustPolicyIgnoreAfter: 262800\n',
    },
    {
      // Wrong value
      code: 'packages:\n  - packages/*\ntrustPolicyIgnoreAfter: 100',
      errors: [{ messageId: 'wrongValue' }],
      output: 'packages:\n  - packages/*\ntrustPolicyIgnoreAfter: 262800',
    },
    {
      // Empty file
      code: '',
      errors: [{ messageId: 'missing' }],
      output: 'trustPolicyIgnoreAfter: 262800\n',
    },
  ],
})
