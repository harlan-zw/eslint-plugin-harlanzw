import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run, runVue } from './_test'
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
      output: $`
        await navigateTo('/')
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
      output: $`
        async function asyncFunction() {
          await navigateTo('/async')
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
      output: $`
        async function mixedFunction() {
          await navigateTo('/good')
          await navigateTo('/bad')
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
      output: $`
        const value = 'test'
        await navigateTo('/')
        console.log('after')
      `,
      errors: [{
        messageId: 'mustAwaitNavigateTo',
      }],
    },
    // Non-async function - no fix should be provided
    {
      code: $`
        function syncFunction() {
          navigateTo('/sync')
        }
      `,
      errors: [{
        messageId: 'mustAwaitOrReturnNavigateTo',
      }],
    },
    // Non-async arrow function - no fix should be provided
    {
      code: $`
        const syncHandler = () => {
          navigateTo('/sync')
        }
      `,
      errors: [{
        messageId: 'mustAwaitOrReturnNavigateTo',
      }],
    },
    // Non-async function expression - no fix should be provided
    {
      code: $`
        const syncHandler = function() {
          navigateTo('/sync')
        }
      `,
      errors: [{
        messageId: 'mustAwaitOrReturnNavigateTo',
      }],
    },
    // Async arrow function with navigateTo - should be fixed
    {
      code: $`
        const asyncHandler = async () => {
          navigateTo('/async-arrow')
        }
      `,
      output: $`
        const asyncHandler = async () => {
          await navigateTo('/async-arrow')
        }
      `,
      errors: [{
        messageId: 'mustAwaitOrReturnNavigateTo',
      }],
    },
    // Async function expression - should be fixed
    {
      code: $`
        const asyncHandler = async function() {
          navigateTo('/async-function')
        }
      `,
      output: $`
        const asyncHandler = async function() {
          await navigateTo('/async-function')
        }
      `,
      errors: [{
        messageId: 'mustAwaitOrReturnNavigateTo',
      }],
    },
    // Complex Vue script setup scenario
    {
      code: $`
        const router = useRouter()
        if (condition) {
          navigateTo('/conditional')
        }
        const result = computed(() => someValue)
      `,
      output: $`
        const router = useRouter()
        if (condition) {
          await navigateTo('/conditional')
        }
        const result = computed(() => someValue)
      `,
      errors: [{
        messageId: 'mustAwaitNavigateTo',
      }],
    },
  ],
})

// Vue SFC tests
runVue({
  name: `${RULE_NAME} (Vue SFC)`,
  rule,
  valid: [
    // Vue SFC - correctly awaited navigateTo
    {
      code: $`
        <script setup>
        // Top-level awaited navigateTo (correct)
        await navigateTo('/')
        
        // Function with awaited navigateTo (correct)
        async function handleNavigation() {
          await navigateTo('/profile')
        }
        
        // Function with returned navigateTo (correct)
        function goToPage() {
          return navigateTo('/page')
        }
        </script>
        
        <template>
          <div>
            <button @click="handleNavigation">Go to Profile</button>
            <button @click="goToPage">Go to Page</button>
          </div>
        </template>
      `,
      filename: 'test.vue',
    },
    // Vue SFC - non-navigateTo calls
    {
      code: $`
        <script setup>
        // Other function calls don't need await
        someOtherFunction()
        
        function handleClick() {
          anotherFunction()
        }
        </script>
        
        <template>
          <button @click="handleClick">Click</button>
        </template>
      `,
      filename: 'test.vue',
    },
  ],
  invalid: [
    // Vue SFC - missing await in top-level
    {
      code: $`
        <script setup>
        // Missing await at top level (incorrect)
        navigateTo('/')
        
        async function handleLogin() {
          await navigateTo('/dashboard')
        }
        </script>
        
        <template>
          <button @click="handleLogin">Login</button>
        </template>
      `,
      output: $`
        <script setup>
        // Missing await at top level (incorrect)
        await navigateTo('/')
        
        async function handleLogin() {
          await navigateTo('/dashboard')
        }
        </script>
        
        <template>
          <button @click="handleLogin">Login</button>
        </template>
      `,
      filename: 'test.vue',
      errors: [{
        messageId: 'mustAwaitNavigateTo',
      }],
    },
    // Vue SFC - missing await in async function (fixable)
    {
      code: $`
        <script setup>
        await navigateTo('/initial')
        
        async function handleAsyncNav() {
          // Missing await in async function (incorrect)
          navigateTo('/async-page')
        }
        </script>
        
        <template>
          <div>
            <button @click="handleAsyncNav">Async Navigate</button>
          </div>
        </template>
      `,
      output: $`
        <script setup>
        await navigateTo('/initial')
        
        async function handleAsyncNav() {
          // Missing await in async function (incorrect)
          await navigateTo('/async-page')
        }
        </script>
        
        <template>
          <div>
            <button @click="handleAsyncNav">Async Navigate</button>
          </div>
        </template>
      `,
      filename: 'test.vue',
      errors: [{
        messageId: 'mustAwaitOrReturnNavigateTo',
      }],
    },
    // Vue SFC - missing await/return in non-async function (not fixable)
    {
      code: $`
        <script setup>
        await navigateTo('/initial')
        
        function handleNavigation() {
          // Missing await or return (incorrect)
          navigateTo('/page')
        }
        </script>
        
        <template>
          <div>
            <button @click="handleNavigation">Navigate</button>
          </div>
        </template>
      `,
      filename: 'test.vue',
      errors: [{
        messageId: 'mustAwaitOrReturnNavigateTo',
      }],
    },
  ],
})
