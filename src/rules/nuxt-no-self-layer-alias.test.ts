import { run } from './_test'
import rule, { RULE_NAME } from './nuxt-no-self-layer-alias'

run({
  name: RULE_NAME,
  rule,
  valid: [
    {
      code: `import { schema } from '#layers/other-layer/shared/contracts'`,
      filename: 'layers/pro-saas-auth/server/api/auth/disconnect.post.ts',
    },
    {
      code: `import { schema } from '#layers/pro-saas-auth/shared/contracts'`,
      filename: 'app/pages/index.vue',
    },
    {
      code: `import { schema } from '../shared/contracts'`,
      filename: 'layers/pro-saas-auth/server/api/auth/disconnect.post.ts',
    },
    {
      code: `import { useFoo } from '@nuxt/kit'`,
      filename: 'layers/pro-saas-auth/server/api/auth/disconnect.post.ts',
    },
  ],
  invalid: [
    {
      code: `import { disconnectIdentityBodySchema } from '#layers/pro-saas-auth/shared/contracts'`,
      filename: 'layers/pro-saas-auth/server/api/auth/disconnect.post.ts',
      output: `import { disconnectIdentityBodySchema } from '../../../shared/contracts'`,
      errors: [{ messageId: 'preferRelative' }],
    },
    {
      code: `import Foo from "#layers/pro-saas-auth/app/components/Foo.vue"`,
      filename: 'layers/pro-saas-auth/app/pages/index.ts',
      output: `import Foo from "../components/Foo.vue"`,
      errors: [{ messageId: 'preferRelative' }],
    },
    {
      code: `export { foo } from '#layers/pro-saas-auth/shared/utils'`,
      filename: 'layers/pro-saas-auth/shared/contracts/index.ts',
      output: `export { foo } from '../utils'`,
      errors: [{ messageId: 'preferRelative' }],
    },
    {
      code: `export * from '#layers/pro-saas-auth/shared/utils'`,
      filename: 'layers/pro-saas-auth/shared/contracts/index.ts',
      output: `export * from '../utils'`,
      errors: [{ messageId: 'preferRelative' }],
    },
    {
      code: `const m = import('#layers/pro-saas-auth/shared/utils')`,
      filename: 'layers/pro-saas-auth/server/api/index.ts',
      output: `const m = import('../../shared/utils')`,
      errors: [{ messageId: 'preferRelative' }],
    },
  ],
})
