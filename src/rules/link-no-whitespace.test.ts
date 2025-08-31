import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './link-no-whitespace'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Valid URLs without whitespace
    {
      code: '<a href="/valid-url">Link</a>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    {
      code: '<NuxtLink to="/nuxt-page">Link</NuxtLink>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    {
      code: '<RouterLink to="/router-page">Link</RouterLink>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    // Dynamic attributes (not checked)
    {
      code: '<a href={dynamicUrl}>Link</a>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  ],
  invalid: [
    {
      code: '<a href="/path with spaces">Link</a>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      output: '<a href="/path%20with%20spaces">Link</a>',
      errors: [{ messageId: 'noWhitespace' }],
    },
    {
      code: '<NuxtLink to="/page with spaces">Link</NuxtLink>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      output: '<NuxtLink to="/page%20with%20spaces">Link</NuxtLink>',
      errors: [{ messageId: 'noWhitespace' }],
    },
    {
      code: '<RouterLink to="/router page">Link</RouterLink>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      output: '<RouterLink to="/router%20page">Link</RouterLink>',
      errors: [{ messageId: 'noWhitespace' }],
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
          <a href="/valid-url">Link</a>
          <NuxtLink to="/nuxt-page">Link</NuxtLink>
          <RouterLink to="/router-page">Link</RouterLink>
        </template>
      `,
      filename: 'test.vue',
    },
    {
      code: $`
        <template>
          <NuxtLink :to="dynamicPath">Link</NuxtLink>
        </template>
      `,
      filename: 'test.vue',
    },
  ],
  invalid: [
    {
      code: $`
        <template>
          <a href="/path with spaces">Link</a>
        </template>
      `,
      output: $`
        <template>
          <a href="/path%20with%20spaces">Link</a>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noWhitespace' }],
    },
    {
      code: $`
        <template>
          <NuxtLink to="/page with spaces">Link</NuxtLink>
        </template>
      `,
      output: $`
        <template>
          <NuxtLink to="/page%20with%20spaces">Link</NuxtLink>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noWhitespace' }],
    },
    {
      code: $`
        <template>
          <RouterLink to="/router page">Link</RouterLink>
        </template>
      `,
      output: $`
        <template>
          <RouterLink to="/router%20page">Link</RouterLink>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noWhitespace' }],
    },
  ],
})
