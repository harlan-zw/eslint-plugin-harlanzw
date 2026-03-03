import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './link-trailing-slash'

// Default: no trailing slashes
run({
  name: `${RULE_NAME} (remove)`,
  rule,
  valid: [
    {
      code: '<a href="/about">About</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    {
      code: '<a href="/">Home</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    {
      code: '<a href="#">Anchor</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    {
      code: '<a href="https://example.com/">External</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  ],
  invalid: [
    {
      code: '<a href="/about/">About</a>',
      output: '<a href="/about">About</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
      errors: [{ messageId: 'removeTrailingSlash' }],
    },
    {
      code: '<NuxtLink to="/products/1/">Product</NuxtLink>',
      output: '<NuxtLink to="/products/1">Product</NuxtLink>',
      parserOptions: { ecmaFeatures: { jsx: true } },
      errors: [{ messageId: 'removeTrailingSlash' }],
    },
  ],
})

// requireTrailingSlash: true
run({
  name: `${RULE_NAME} (require)`,
  rule,
  valid: [
    {
      code: '<a href="/about/">About</a>',
      options: [{ requireTrailingSlash: true }],
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  ],
  invalid: [
    {
      code: '<a href="/about">About</a>',
      output: '<a href="/about/">About</a>',
      options: [{ requireTrailingSlash: true }],
      parserOptions: { ecmaFeatures: { jsx: true } },
      errors: [{ messageId: 'addTrailingSlash' }],
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
          <a href="/about">About</a>
          <NuxtLink to="/products/1">Product</NuxtLink>
        </template>
      `,
      filename: 'test.vue',
    },
    {
      code: $`
        <template>
          <a href="/">Home</a>
          <a href="#">Anchor</a>
          <a href="https://example.com/">External</a>
        </template>
      `,
      filename: 'test.vue',
    },
  ],
  invalid: [
    {
      code: $`
        <template>
          <a href="/about/">About</a>
        </template>
      `,
      output: $`
        <template>
          <a href="/about">About</a>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'removeTrailingSlash' }],
    },
    {
      code: $`
        <template>
          <NuxtLink to="/contact/">Contact</NuxtLink>
        </template>
      `,
      output: $`
        <template>
          <NuxtLink to="/contact">Contact</NuxtLink>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'removeTrailingSlash' }],
    },
  ],
})
