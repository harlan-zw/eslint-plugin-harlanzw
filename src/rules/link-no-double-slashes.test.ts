import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './link-no-double-slashes'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Valid URLs without double slashes
    {
      code: '<a href="/valid/path">Link</a>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    {
      code: '<NuxtLink to="/nuxt/page">Link</NuxtLink>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    {
      code: '<RouterLink to="/router/page">Link</RouterLink>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    // Protocol-relative URLs (should be ignored)
    {
      code: '<a href="//example.com/path">Link</a>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    // Full URLs (should be ignored)
    {
      code: '<a href="https://example.com/path">Link</a>',
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
      code: '<a href="/path//with//double">Link</a>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      output: '<a href="/path/with/double">Link</a>',
      errors: [{ messageId: 'doubleSlashes' }],
    },
    {
      code: '<NuxtLink to="/page//section">Link</NuxtLink>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      output: '<NuxtLink to="/page/section">Link</NuxtLink>',
      errors: [{ messageId: 'doubleSlashes' }],
    },
    {
      code: '<RouterLink to="/router///page">Link</RouterLink>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      output: '<RouterLink to="/router/page">Link</RouterLink>',
      errors: [{ messageId: 'doubleSlashes' }],
    },
    {
      code: '<a href="/path//to?query=1#hash">Link</a>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      output: '<a href="/path/to?query=1#hash">Link</a>',
      errors: [{ messageId: 'doubleSlashes' }],
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
          <a href="/valid/path">Link</a>
          <NuxtLink to="/nuxt/page">Link</NuxtLink>
          <RouterLink to="/router/page">Link</RouterLink>
        </template>
      `,
      filename: 'test.vue',
    },
    {
      code: $`
        <template>
          <a href="//example.com/path">External Link</a>
          <a href="https://example.com/path">Full URL</a>
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
          <a href="/path//with//double">Link</a>
        </template>
      `,
      output: $`
        <template>
          <a href="/path/with/double">Link</a>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'doubleSlashes' }],
    },
    {
      code: $`
        <template>
          <NuxtLink to="/page//section">Link</NuxtLink>
        </template>
      `,
      output: $`
        <template>
          <NuxtLink to="/page/section">Link</NuxtLink>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'doubleSlashes' }],
    },
    {
      code: $`
        <template>
          <RouterLink to="/router///page">Link</RouterLink>
        </template>
      `,
      output: $`
        <template>
          <RouterLink to="/router/page">Link</RouterLink>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'doubleSlashes' }],
    },
    {
      code: $`
        <template>
          <a href="/path//to?query=1#hash">Link</a>
        </template>
      `,
      output: $`
        <template>
          <a href="/path/to?query=1#hash">Link</a>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'doubleSlashes' }],
    },
  ],
})
