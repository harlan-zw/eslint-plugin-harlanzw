import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './link-no-underscores'

run({
  name: RULE_NAME,
  rule,
  valid: [
    {
      code: '<a href="/about-us">About</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    {
      code: '<a href="/blog-posts">Blog</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    {
      code: '<a href="https://example.com/some_path">External</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  ],
  invalid: [
    {
      code: '<a href="/about_us">About</a>',
      output: '<a href="/about-us">About</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
      errors: [{ messageId: 'underscores' }],
    },
    {
      code: '<NuxtLink to="/blog_posts">Blog</NuxtLink>',
      output: '<NuxtLink to="/blog-posts">Blog</NuxtLink>',
      parserOptions: { ecmaFeatures: { jsx: true } },
      errors: [{ messageId: 'underscores' }],
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
          <a href="/about-us">About</a>
          <NuxtLink to="/blog-posts">Blog</NuxtLink>
        </template>
      `,
      filename: 'test.vue',
    },
    {
      code: $`
        <template>
          <a href="https://example.com/some_path">External</a>
        </template>
      `,
      filename: 'test.vue',
    },
  ],
  invalid: [
    {
      code: $`
        <template>
          <a href="/about_us">About</a>
        </template>
      `,
      output: $`
        <template>
          <a href="/about-us">About</a>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'underscores' }],
    },
    {
      code: $`
        <template>
          <NuxtLink to="/blog_posts">Blog</NuxtLink>
        </template>
      `,
      output: $`
        <template>
          <NuxtLink to="/blog-posts">Blog</NuxtLink>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'underscores' }],
    },
  ],
})
