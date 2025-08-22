import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './nuxt-prefer-navigate-to-over-router-push-replace'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Using navigateTo directly
    $`
      navigateTo('/')
    `,
    // Using navigateTo with params
    $`
      await navigateTo('/about', { replace: true })
    `,
    // useRouter without push/replace calls
    $`
      const router = useRouter()
      console.log(router.currentRoute)
    `,
    // Different variable name for useRouter but no push/replace
    $`
      const $router = useRouter()
      const route = $router.currentRoute
    `,
    // Router variable not from useRouter
    $`
      const router = getCustomRouter()
      router.push('/custom')
    `,
    // Push/replace on different object
    $`
      const array = []
      array.push(item)
    `,
    // Method calls that aren't push/replace
    $`
      const router = useRouter()
      router.go(-1)
      router.back()
    `,
    // Using router for other purposes
    $`
      const router = useRouter()
      const currentPath = router.currentRoute.value.path
      if (currentPath === '/login') {
        navigateTo('/dashboard')
      }
    `,
    // Assignment from different function
    $`
      let router = createRouter()
      router.push('/test')
    `,
  ],
  invalid: [
    // Basic router.push
    {
      code: $`
        const router = useRouter()
        router.push('/')
      `,
      output: $`
        const router = useRouter()
        navigateTo('/')
      `,
      errors: [{
        messageId: 'preferNavigateTo',
        data: { method: 'push' },
      }],
    },
    // Basic router.replace
    {
      code: $`
        const router = useRouter()
        router.replace('/about')
      `,
      output: $`
        const router = useRouter()
        navigateTo('/about', { replace: true })
      `,
      errors: [{
        messageId: 'preferNavigateTo',
        data: { method: 'replace' },
      }],
    },
    // Different variable name
    {
      code: $`
        const $router = useRouter()
        $router.push('/test')
      `,
      output: $`
        const $router = useRouter()
        navigateTo('/test')
      `,
      errors: [{
        messageId: 'preferNavigateTo',
        data: { method: 'push' },
      }],
    },
    // Multiple router calls
    {
      code: $`
        const router = useRouter()
        router.push('/first')
        router.replace('/second')
      `,
      output: $`
        const router = useRouter()
        navigateTo('/first')
        navigateTo('/second', { replace: true })
      `,
      errors: [
        {
          messageId: 'preferNavigateTo',
          data: { method: 'push' },
        },
        {
          messageId: 'preferNavigateTo',
          data: { method: 'replace' },
        },
      ],
    },
    // Assignment expression instead of declaration
    {
      code: $`
        let router
        router = useRouter()
        router.push('/assigned')
      `,
      output: $`
        let router
        router = useRouter()
        navigateTo('/assigned')
      `,
      errors: [{
        messageId: 'preferNavigateTo',
        data: { method: 'push' },
      }],
    },
    // Router.push with complex arguments
    {
      code: $`
        const router = useRouter()
        router.push({ 
          path: '/complex',
          query: { id: '123' }
        })
      `,
      output: $`
        const router = useRouter()
        navigateTo({ 
          path: '/complex',
          query: { id: '123' }
        })
      `,
      errors: [{
        messageId: 'preferNavigateTo',
        data: { method: 'push' },
      }],
    },
    // Router.replace with options
    {
      code: $`
        const router = useRouter()
        router.replace({ name: 'about' })
      `,
      output: $`
        const router = useRouter()
        navigateTo({ name: 'about' }, { replace: true })
      `,
      errors: [{
        messageId: 'preferNavigateTo',
        data: { method: 'replace' },
      }],
    },
    // Router.replace with path and options
    {
      code: $`
        const router = useRouter()
        router.replace('/about', { force: true })
      `,
      output: $`
        const router = useRouter()
        navigateTo('/about', { ...{ force: true }, replace: true })
      `,
      errors: [{
        messageId: 'preferNavigateTo',
        data: { method: 'replace' },
      }],
    },
    // In function
    {
      code: $`
        function handleNavigation() {
          const router = useRouter()
          router.push('/function')
        }
      `,
      errors: [{
        messageId: 'preferNavigateTo',
        data: { method: 'push' },
      }],
    },
    // In async function
    {
      code: $`
        async function handleAsyncNavigation() {
          const router = useRouter()
          await router.push('/async')
        }
      `,
      errors: [{
        messageId: 'preferNavigateTo',
        data: { method: 'push' },
      }],
    },
    // In arrow function
    {
      code: $`
        const handler = () => {
          const router = useRouter()
          router.push('/arrow')
        }
      `,
      errors: [{
        messageId: 'preferNavigateTo',
        data: { method: 'push' },
      }],
    },
    // Multiple routers with same name (scoping)
    {
      code: $`
        const router = useRouter()
        router.push('/outer')
        
        function inner() {
          const router = useRouter()
          router.replace('/inner')
        }
      `,
      errors: [
        {
          messageId: 'preferNavigateTo',
          data: { method: 'push' },
        },
        {
          messageId: 'preferNavigateTo',
          data: { method: 'replace' },
        },
      ],
    },
    // Conditional router usage
    {
      code: $`
        const router = useRouter()
        if (condition) {
          router.push('/conditional')
        }
      `,
      errors: [{
        messageId: 'preferNavigateTo',
        data: { method: 'push' },
      }],
    },
    // Router in try-catch
    {
      code: $`
        const router = useRouter()
        try {
          router.push('/try')
        } catch (error) {
          router.replace('/error')
        }
      `,
      errors: [
        {
          messageId: 'preferNavigateTo',
          data: { method: 'push' },
        },
        {
          messageId: 'preferNavigateTo',
          data: { method: 'replace' },
        },
      ],
    },
  ],
})

// Vue SFC tests
runVue({
  name: `${RULE_NAME} (Vue SFC)`,
  rule,
  valid: [
    // Vue SFC - correct navigateTo usage
    {
      code: $`
        <script setup>
        // Using navigateTo correctly
        await navigateTo('/')
        navigateTo('/about', { replace: true })
        
        function handleClick() {
          navigateTo('/clicked')
        }
        </script>
        
        <template>
          <div>
            <button @click="handleClick">Click me</button>
          </div>
        </template>
      `,
      filename: 'test.vue',
    },
    // Vue SFC - router from different source
    {
      code: $`
        <script setup>
        const customRouter = getCustomRouter()
        customRouter.push('/custom')
        
        const router = useRouter()
        router.go(-1)
        router.back()
        </script>
        
        <template>
          <div>Custom router usage</div>
        </template>
      `,
      filename: 'test.vue',
    },
  ],
  invalid: [
    // Vue SFC - router.push in script setup
    {
      code: $`
        <script setup>
        const router = useRouter()
        router.push('/profile')
        
        function handleLogin() {
          router.replace('/dashboard')
        }
        </script>
        
        <template>
          <div>
            <button @click="handleLogin">Login</button>
          </div>
        </template>
      `,
      output: $`
        <script setup>
        const router = useRouter()
        navigateTo('/profile')
        
        function handleLogin() {
          navigateTo('/dashboard', { replace: true })
        }
        </script>
        
        <template>
          <div>
            <button @click="handleLogin">Login</button>
          </div>
        </template>
      `,
      filename: 'test.vue',
      errors: [
        {
          messageId: 'preferNavigateTo',
          data: { method: 'push' },
        },
        {
          messageId: 'preferNavigateTo',
          data: { method: 'replace' },
        },
      ],
    },
    // Vue SFC - complex router usage
    {
      code: $`
        <script setup>
        const $router = useRouter()
        
        async function handleNavigation() {
          const result = await someAsyncOperation()
          if (result.success) {
            $router.push({ 
              path: '/success',
              query: { id: result.id }
            })
          } else {
            $router.replace('/error')
          }
        }
        </script>
        
        <template>
          <button @click="handleNavigation">Navigate</button>
        </template>
      `,
      output: $`
        <script setup>
        const $router = useRouter()
        
        async function handleNavigation() {
          const result = await someAsyncOperation()
          if (result.success) {
            navigateTo({ 
              path: '/success',
              query: { id: result.id }
            })
          } else {
            navigateTo('/error', { replace: true })
          }
        }
        </script>
        
        <template>
          <button @click="handleNavigation">Navigate</button>
        </template>
      `,
      filename: 'test.vue',
      errors: [
        {
          messageId: 'preferNavigateTo',
          data: { method: 'push' },
        },
        {
          messageId: 'preferNavigateTo',
          data: { method: 'replace' },
        },
      ],
    },
    // Vue SFC - router usage in composable pattern
    {
      code: $`
        <script setup>
        function useNavigation() {
          const router = useRouter()
          
          const goToProfile = () => {
            router.push('/profile')
          }
          
          const goToSettings = () => {
            router.replace('/settings')
          }
          
          return { goToProfile, goToSettings }
        }
        
        const { goToProfile, goToSettings } = useNavigation()
        </script>
        
        <template>
          <div>
            <button @click="goToProfile">Profile</button>
            <button @click="goToSettings">Settings</button>
          </div>
        </template>
      `,
      output: $`
        <script setup>
        function useNavigation() {
          const router = useRouter()
          
          const goToProfile = () => {
            navigateTo('/profile')
          }
          
          const goToSettings = () => {
            navigateTo('/settings', { replace: true })
          }
          
          return { goToProfile, goToSettings }
        }
        
        const { goToProfile, goToSettings } = useNavigation()
        </script>
        
        <template>
          <div>
            <button @click="goToProfile">Profile</button>
            <button @click="goToSettings">Settings</button>
          </div>
        </template>
      `,
      filename: 'test.vue',
      errors: [
        {
          messageId: 'preferNavigateTo',
          data: { method: 'push' },
        },
        {
          messageId: 'preferNavigateTo',
          data: { method: 'replace' },
        },
      ],
    },
  ],
})
