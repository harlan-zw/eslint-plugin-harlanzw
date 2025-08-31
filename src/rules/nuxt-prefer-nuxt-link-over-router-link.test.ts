import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './nuxt-prefer-nuxt-link-over-router-link'

// JSX/TSX tests
run({
  name: RULE_NAME,
  rule,
  valid: [
    // Valid: Using NuxtLink in JSX
    {
      code: '<NuxtLink to="/page">Link</NuxtLink>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    // Valid: Using NuxtLink with props in JSX
    {
      code: '<NuxtLink to="/page" className="link">Link</NuxtLink>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    // Valid: Self-closing NuxtLink in JSX
    {
      code: '<NuxtLink to="/page" />',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    // Valid: Other components
    {
      code: '<SomeOtherLink to="/page">Link</SomeOtherLink>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  ],
  invalid: [
    // Invalid: RouterLink with closing tag in JSX
    {
      code: '<RouterLink to="/page">Link</RouterLink>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      errors: [{
        messageId: 'preferNuxtLink',
      }],
      output: '<NuxtLink to="/page">Link</NuxtLink>',
    },
    // Invalid: RouterLink self-closing in JSX
    {
      code: '<RouterLink to="/page" />',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      errors: [{
        messageId: 'preferNuxtLink',
      }],
      output: '<NuxtLink to="/page" />',
    },
    // Invalid: RouterLink with multiple attributes in JSX
    {
      code: '<RouterLink to="/page" className="link" disabled={false}>Click me</RouterLink>',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      errors: [{
        messageId: 'preferNuxtLink',
      }],
      output: '<NuxtLink to="/page" className="link" disabled={false}>Click me</NuxtLink>',
    },
  ],
})

// Vue SFC tests
runVue({
  name: `${RULE_NAME} (Vue SFC)`,
  rule,
  valid: [
    // Valid: Using NuxtLink in Vue SFC
    {
      code: $`
        <template>
          <NuxtLink to="/page">Link</NuxtLink>
        </template>
      `,
      filename: 'test.vue',
    },
    // Valid: Using NuxtLink with props in Vue SFC
    {
      code: $`
        <template>
          <NuxtLink to="/page" class="link">Link</NuxtLink>
        </template>
      `,
      filename: 'test.vue',
    },
    // Valid: Self-closing NuxtLink in Vue SFC
    {
      code: $`
        <template>
          <NuxtLink to="/page" />
        </template>
      `,
      filename: 'test.vue',
    },
    // Valid: Other components in Vue SFC
    {
      code: $`
        <template>
          <SomeOtherLink to="/page">Link</SomeOtherLink>
        </template>
      `,
      filename: 'test.vue',
    },
    // Valid: Mixed components in Vue SFC
    {
      code: $`
        <template>
          <div>
            <NuxtLink to="/page1">Link 1</NuxtLink>
            <SomeOtherLink to="/page2">Link 2</SomeOtherLink>
          </div>
        </template>
      `,
      filename: 'test.vue',
    },
  ],
  invalid: [
    // Invalid: RouterLink with closing tag in Vue SFC
    {
      code: $`
        <template>
          <RouterLink to="/page">Link</RouterLink>
        </template>
      `,
      filename: 'test.vue',
      errors: [{
        messageId: 'preferNuxtLink',
      }],
      output: $`
        <template>
          <NuxtLink to="/page">Link</NuxtLink>
        </template>
      `,
    },
    // Invalid: RouterLink self-closing in Vue SFC
    {
      code: $`
        <template>
          <RouterLink to="/page" />
        </template>
      `,
      filename: 'test.vue',
      errors: [{
        messageId: 'preferNuxtLink',
      }],
      output: $`
        <template>
          <NuxtLink to="/page" />
        </template>
      `,
    },
    // Invalid: RouterLink with multiple attributes in Vue SFC
    {
      code: $`
        <template>
          <RouterLink to="/page" class="link" :disabled="false">
            Click me
          </RouterLink>
        </template>
      `,
      filename: 'test.vue',
      errors: [{
        messageId: 'preferNuxtLink',
      }],
      output: $`
        <template>
          <NuxtLink to="/page" class="link" :disabled="false">
            Click me
          </NuxtLink>
        </template>
      `,
    },
    // Invalid: Multiple RouterLinks in Vue SFC
    {
      code: $`
        <template>
          <div>
            <RouterLink to="/page1">Link 1</RouterLink>
            <RouterLink to="/page2">Link 2</RouterLink>
          </div>
        </template>
      `,
      filename: 'test.vue',
      errors: [
        {
          messageId: 'preferNuxtLink',
        },
        {
          messageId: 'preferNuxtLink',
        },
      ],
      output: $`
        <template>
          <div>
            <NuxtLink to="/page1">Link 1</NuxtLink>
            <NuxtLink to="/page2">Link 2</NuxtLink>
          </div>
        </template>
      `,
    },
    // Invalid: Complex RouterLink usage in Vue SFC
    {
      code: $`
        <template>
          <nav>
            <RouterLink 
              to="/home" 
              class="nav-link"
              active-class="active"
              @click="handleClick"
            >
              Home
            </RouterLink>
            <RouterLink to="/about">About</RouterLink>
          </nav>
        </template>
      `,
      filename: 'test.vue',
      errors: [
        {
          messageId: 'preferNuxtLink',
        },
        {
          messageId: 'preferNuxtLink',
        },
      ],
      output: $`
        <template>
          <nav>
            <NuxtLink 
              to="/home" 
              class="nav-link"
              active-class="active"
              @click="handleClick"
            >
              Home
            </NuxtLink>
            <NuxtLink to="/about">About</NuxtLink>
          </nav>
        </template>
      `,
    },
    // Invalid: lowercase router-link in Vue SFC
    {
      code: $`
        <template>
          <router-link to="/page">Link</router-link>
        </template>
      `,
      filename: 'test.vue',
      errors: [{
        messageId: 'preferNuxtLink',
      }],
      output: $`
        <template>
          <NuxtLink to="/page">Link</NuxtLink>
        </template>
      `,
    },
    // Invalid: Mixed case RouterLink/router-link in Vue SFC
    {
      code: $`
        <template>
          <div>
            <RouterLink to="/page1">Link 1</RouterLink>
            <router-link to="/page2">Link 2</router-link>
          </div>
        </template>
      `,
      filename: 'test.vue',
      errors: [
        {
          messageId: 'preferNuxtLink',
        },
        {
          messageId: 'preferNuxtLink',
        },
      ],
      output: $`
        <template>
          <div>
            <NuxtLink to="/page1">Link 1</NuxtLink>
            <NuxtLink to="/page2">Link 2</NuxtLink>
          </div>
        </template>
      `,
    },
  ],
})
