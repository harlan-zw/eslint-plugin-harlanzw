import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run } from './_test'
import rule, { RULE_NAME } from './nuxt-prefer-layer-alias'

run({
  name: RULE_NAME,
  rule,
  valid: [
    $`import Foo from '#layers/pro-gsc/app/components/Foo.vue'`,
    $`import Foo from '~~/components/Foo.vue'`,
    $`import Foo from '~/components/Foo.vue'`,
    $`import { useThing } from '@nuxt/kit'`,
    $`import('./local.ts')`,
  ],
  invalid: [
    {
      code: `import ProPositionMetric from '~~/layers/pro-gsc/app/components/pro/ProPositionMetric.vue'`,
      output: `import ProPositionMetric from '#layers/pro-gsc/app/components/pro/ProPositionMetric.vue'`,
      errors: [{ messageId: 'preferLayerAlias' }],
    },
    {
      code: `import Foo from "@@/layers/pro-gsc/app/components/Foo.vue"`,
      output: `import Foo from "#layers/pro-gsc/app/components/Foo.vue"`,
      errors: [{ messageId: 'preferLayerAlias' }],
    },
    {
      code: `import Foo from '~/layers/pro-gsc/app/components/Foo.vue'`,
      output: `import Foo from '#layers/pro-gsc/app/components/Foo.vue'`,
      errors: [{ messageId: 'preferLayerAlias' }],
    },
    {
      code: `import Foo from '@/layers/pro-gsc/app/components/Foo.vue'`,
      output: `import Foo from '#layers/pro-gsc/app/components/Foo.vue'`,
      errors: [{ messageId: 'preferLayerAlias' }],
    },
    {
      code: `export { default as Foo } from '~~/layers/pro-gsc/app/components/Foo.vue'`,
      output: `export { default as Foo } from '#layers/pro-gsc/app/components/Foo.vue'`,
      errors: [{ messageId: 'preferLayerAlias' }],
    },
    {
      code: `export * from '~~/layers/pro-gsc/app/utils/index.ts'`,
      output: `export * from '#layers/pro-gsc/app/utils/index.ts'`,
      errors: [{ messageId: 'preferLayerAlias' }],
    },
    {
      code: `const m = import('~~/layers/pro-gsc/app/utils/index.ts')`,
      output: `const m = import('#layers/pro-gsc/app/utils/index.ts')`,
      errors: [{ messageId: 'preferLayerAlias' }],
    },
  ],
})
