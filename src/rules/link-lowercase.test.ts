import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './link-lowercase'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Valid URLs with only lowercase characters
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
      code: '<a href="/Page">Link</a>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      output: '<a href="/page">Link</a>',
      errors: [{ messageId: 'uppercase' }],
    },
    {
      code: '<NuxtLink to="/About-Us">Link</NuxtLink>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      output: '<NuxtLink to="/about-us">Link</NuxtLink>',
      errors: [{ messageId: 'uppercase' }],
    },
    {
      code: '<RouterLink to="/Contact-Page">Link</RouterLink>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      output: '<RouterLink to="/contact-page">Link</RouterLink>',
      errors: [{ messageId: 'uppercase' }],
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
          <a href="/Page">Link</a>
        </template>
      `,
      output: $`
        <template>
          <a href="/page">Link</a>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'uppercase' }],
    },
    {
      code: $`
        <template>
          <NuxtLink to="/About-Us">Link</NuxtLink>
        </template>
      `,
      output: $`
        <template>
          <NuxtLink to="/about-us">Link</NuxtLink>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'uppercase' }],
    },
    {
      code: $`
        <template>
          <RouterLink to="/Contact-Page">Link</RouterLink>
        </template>
      `,
      output: $`
        <template>
          <RouterLink to="/contact-page">Link</RouterLink>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'uppercase' }],
    },
  ],
})
