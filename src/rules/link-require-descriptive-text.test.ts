import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './link-require-descriptive-text'

run({
  name: RULE_NAME,
  rule,
  valid: [
    {
      code: '<a href="/about">Learn more about our company</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    {
      code: '<a href="/contact" aria-label="Contact support">Icon</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  ],
  invalid: [
    {
      code: '<a href="/about">click here</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
      errors: [{ messageId: 'nonDescriptive' }],
    },
    {
      code: '<a href="/about">read more</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
      errors: [{ messageId: 'nonDescriptive' }],
    },
    {
      code: '<a href="/about">here</a>',
      parserOptions: { ecmaFeatures: { jsx: true } },
      errors: [{ messageId: 'nonDescriptive' }],
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
          <a href="/about">Learn more about our company</a>
        </template>
      `,
      filename: 'test.vue',
    },
    {
      code: $`
        <template>
          <NuxtLink to="/page" title="Go to page">Icon</NuxtLink>
        </template>
      `,
      filename: 'test.vue',
    },
  ],
  invalid: [
    {
      code: $`
        <template>
          <a href="/about">click here</a>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'nonDescriptive' }],
    },
    {
      code: $`
        <template>
          <NuxtLink to="/page">learn more</NuxtLink>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'nonDescriptive' }],
    },
    {
      code: $`
        <template>
          <a href="/page"></a>
        </template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'nonDescriptive' }],
    },
  ],
})
