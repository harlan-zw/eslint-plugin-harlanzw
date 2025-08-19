import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run } from './_test'
import rule, { RULE_NAME } from './nuxt-await-navigate-to'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Awaited navigateTo in function
    $`
      export async function useNonAwaitedNavigateToAwait() {
        await navigateTo('/')
      }
    `,
    // Returned navigateTo in function
    $`
      export async function useNonAwaitedNavigateToReturn() {
        return navigateTo('/')
      }
    `,
    // Awaited navigateTo at top level (Vue script setup)
    $`
      await navigateTo('/')
    `,
    // navigateTo with await in nested function
    $`
      function outerFunction() {
        return async function innerFunction() {
          await navigateTo('/inner')
        }
      }
    `,
    // navigateTo with return in nested function
    $`
      function outerFunction() {
        return function innerFunction() {
          return navigateTo('/inner')
        }
      }
    `,
    // navigateTo in arrow function with await
    $`
      const handler = async () => {
        await navigateTo('/handler')
      }
    `,
    // navigateTo in arrow function with return
    $`
      const handler = () => {
        return navigateTo('/handler')
      }
    `,
    // Other function calls (not navigateTo)
    $`
      function useOther() {
        someOtherFunction()
      }
    `,
    // navigateTo with complex return expression
    $`
      function complexReturn() {
        return condition ? navigateTo('/a') : navigateTo('/b')
      }
    `,
    // navigateTo in try-catch with await
    $`
      async function withTryCatch() {
        try {
          await navigateTo('/success')
        } catch (error) {
          await navigateTo('/error')
        }
      }
    `,
  ],
  invalid: [
    // Non-awaited navigateTo in function
    {
      code: $`
        export function useNonAwaitedNavigateTo() {
          navigateTo('/')
        }
      `,
      errors: [{
        messageId: 'mustAwaitOrReturnNavigateTo',
      }],
    },
    // Non-awaited navigateTo at top level
    {
      code: $`
        navigateTo('/')
      `,
      errors: [{
        messageId: 'mustAwaitNavigateTo',
      }],
    },
    // Non-awaited navigateTo in async function
    {
      code: $`
        async function asyncFunction() {
          navigateTo('/async')
        }
      `,
      errors: [{
        messageId: 'mustAwaitOrReturnNavigateTo',
      }],
    },
    // Non-awaited navigateTo in arrow function
    {
      code: $`
        const handler = () => {
          navigateTo('/handler')
        }
      `,
      errors: [{
        messageId: 'mustAwaitOrReturnNavigateTo',
      }],
    },
    // Non-awaited navigateTo in function expression
    {
      code: $`
        const handler = function() {
          navigateTo('/handler')
        }
      `,
      errors: [{
        messageId: 'mustAwaitOrReturnNavigateTo',
      }],
    },
    // Multiple navigateTo calls, some invalid
    {
      code: $`
        async function mixedFunction() {
          await navigateTo('/good')
          navigateTo('/bad')
          return navigateTo('/also-good')
        }
      `,
      errors: [{
        messageId: 'mustAwaitOrReturnNavigateTo',
      }],
    },
    // navigateTo in if statement without await/return
    {
      code: $`
        function conditionalNavigate(condition) {
          if (condition) {
            navigateTo('/conditional')
          }
        }
      `,
      errors: [{
        messageId: 'mustAwaitOrReturnNavigateTo',
      }],
    },
    // navigateTo in nested block without await/return
    {
      code: $`
        function nestedBlock() {
          {
            navigateTo('/nested')
          }
        }
      `,
      errors: [{
        messageId: 'mustAwaitOrReturnNavigateTo',
      }],
    },
    // Top level navigateTo in multiple statements
    {
      code: $`
        const value = 'test'
        navigateTo('/')
        console.log('after')
      `,
      errors: [{
        messageId: 'mustAwaitNavigateTo',
      }],
    },
  ],
})
