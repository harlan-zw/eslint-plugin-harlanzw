import { RuleTester } from 'eslint'
import * as yamlParser from 'yaml-eslint-parser'
import rule from './pnpm-require-trust-policy'

const ruleTester = new RuleTester({
  languageOptions: {
    parser: yamlParser,
  },
})

ruleTester.run('harlanzw/pnpm-require-trust-policy', rule, {
  valid: [
    'packages:\n  - packages/*\ntrustPolicyIgnoreAfter: 262800',
    'trustPolicyIgnoreAfter: 262800',
    'catalog:\n  vue: ^3.5.0\ntrustPolicyIgnoreAfter: 262800\nonlyBuiltDependencies:\n  - esbuild',
  ],
  invalid: [
    {
      code: 'packages:\n  - packages/*',
      errors: [{ messageId: 'missing' }],
      output: 'packages:\n  - packages/*\n\ntrustPolicyIgnoreAfter: 262800\n',
    },
    {
      code: 'packages:\n  - packages/*\n',
      errors: [{ messageId: 'missing' }],
      output: 'packages:\n  - packages/*\n\ntrustPolicyIgnoreAfter: 262800\n',
    },
    {
      code: 'onlyBuiltDependencies:\n  - esbuild\n  - sharp\n',
      errors: [{ messageId: 'missing' }],
      output: 'onlyBuiltDependencies:\n  - esbuild\n  - sharp\n\ntrustPolicyIgnoreAfter: 262800\n',
    },
    {
      code: 'packages:\n  - packages/*\ntrustPolicyIgnoreAfter: 100',
      errors: [{ messageId: 'wrongValue' }],
      output: 'packages:\n  - packages/*\ntrustPolicyIgnoreAfter: 262800',
    },
  ],
})
