import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './link-require-href'

run({
  name: RULE_NAME,
  rule,
  valid: [
    {
      code: '<a href="/page">Link</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    {
      code: '<a href="#">Link</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    {
      code: '<NuxtLink to="/page">Link</NuxtLink>',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    {
      code: '<a role="button">Button</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  ],
  invalid: [
    {
      code: '<a>Missing href</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
      errors: [{ messageId: 'missingHref' }],
    },
    {
      code: '<a class="nav-link">No href</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
      errors: [{ messageId: 'missingHref' }],
    },
  ],
})

runVue({
  name: `${RULE_NAME} (Vue SFC)`,
  rule,
  valid: [
    {
      code: $`
        <template>
          <a href="/page">Link</a>
        </template>
      `,
      filename: 'test.vue',
    },
    {
      code: $`
        <template>
          <NuxtLink to="/page">Link</NuxtLink>
        </template>
      `,
      filename: 'test.vue',
    },
    {
      code: $`
        <template>
          <a :href="dynamicUrl">Link</a>
        </template>
      `,
      filename: 'test.vue',
    },
    {
      code: $`
        <template>
          <a role="button" @click="handle">Button</a>
        </template>
      `,
      filename: 'test.vue',
    },
  ],
  invalid: [
    {
      code: $`
        <template>
          <a>Missing href</a>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'missingHref' }],
    },
    {
      code: $`
        <template>
          <a class="nav-link" @click="handle">No href</a>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'missingHref' }],
    },
  ],
})
