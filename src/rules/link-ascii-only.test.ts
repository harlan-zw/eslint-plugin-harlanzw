import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './link-ascii-only'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Valid URLs with only ASCII characters
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
      code: '<a href="/página">Link</a>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      output: '<a href="/p%C3%A1gina">Link</a>',
      errors: [{ messageId: 'nonAscii' }],
    },
    {
      code: '<NuxtLink to="/测试">Link</NuxtLink>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      output: '<NuxtLink to="/%E6%B5%8B%E8%AF%95">Link</NuxtLink>',
      errors: [{ messageId: 'nonAscii' }],
    },
    {
      code: '<RouterLink to="/café">Link</RouterLink>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      output: '<RouterLink to="/caf%C3%A9">Link</RouterLink>',
      errors: [{ messageId: 'nonAscii' }],
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
          <a href="/página">Link</a>
        </template>
      `,
      output: $`
        <template>
          <a href="/p%C3%A1gina">Link</a>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'nonAscii' }],
    },
    {
      code: $`
        <template>
          <NuxtLink to="/测试">Link</NuxtLink>
        </template>
      `,
      output: $`
        <template>
          <NuxtLink to="/%E6%B5%8B%E8%AF%95">Link</NuxtLink>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'nonAscii' }],
    },
    {
      code: $`
        <template>
          <RouterLink to="/café">Link</RouterLink>
        </template>
      `,
      output: $`
        <template>
          <RouterLink to="/caf%C3%A9">Link</RouterLink>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'nonAscii' }],
    },
  ],
})
