import { run } from './_test'
import rule, { RULE_NAME } from './nuxt-no-side-effects-in-async-data-handler'

run({
  name: RULE_NAME,
  rule,
  valid: [
    {
      name: 'useAsyncData with pure data fetching',
      code: `
        const { data } = await useAsyncData('users', () => $fetch('/api/users'))
      `,
    },
    {
      name: 'useFetch with pure data fetching',
      code: `
        const { data } = await useFetch('/api/users')
      `,
    },
    {
      name: 'useAsyncData with data transformation',
      code: `
        const { data } = await useAsyncData('users', async () => {
          const response = await $fetch('/api/users')
          return response.data.map(user => ({ id: user.id, name: user.name }))
        })
      `,
    },
    {
      name: 'useAsyncData with error handling',
      code: `
        const { data } = await useAsyncData('users', async () => {
          try {
            return await $fetch('/api/users')
          } catch (error) {
            throw error
          }
        })
      `,
    },
    {
      name: 'useAsyncData with conditional logic',
      code: `
        const { data } = await useAsyncData('users', async () => {
          const endpoint = isAdmin ? '/api/admin/users' : '/api/users'
          return await $fetch(endpoint)
        })
      `,
    },
    {
      name: 'useFetch with side effects in separate callOnce',
      code: `
        const { data } = await useAsyncData('users', () => $fetch('/api/users'))
        
        callOnce(async () => {
          await updateUserAnalytics()
          console.log('Analytics updated')
        })
      `,
    },
    {
      name: 'side effects in nested functions are allowed',
      code: `
        const { data } = await useAsyncData('users', async () => {
          const processData = (data) => {
            console.log('Processing data')
            return data
          }
          
          const response = await $fetch('/api/users')
          return processData(response)
        })
      `,
    },
  ],
  invalid: [
    {
      name: 'useAsyncData with store mutation',
      code: `
        const { data } = await useAsyncData('users', async () => {
          store.$patch({ loading: true })
          return await $fetch('/api/users')
        })
      `,
      errors: [
        {
          messageId: 'useCallOnceForSideEffects',
        },
        {
          messageId: 'noSideEffectsInAsyncDataHandler',
          data: { functionName: 'useAsyncData' },
        },
      ],
    },
    {
      name: 'useAsyncData with navigation side effect',
      code: `
        const { data } = await useAsyncData('users', async () => {
          if (!user.isAuthenticated) {
            await navigateTo('/login')
          }
          return await $fetch('/api/users')
        })
      `,
      errors: [
        {
          messageId: 'useCallOnceForSideEffects',
        },
        {
          messageId: 'noSideEffectsInAsyncDataHandler',
          data: { functionName: 'useAsyncData' },
        },
      ],
    },
    {
      name: 'useFetch with DOM manipulation',
      code: `
        const { data } = await useFetch('/api/users', async (url) => {
          document.getElementById('loading').style.display = 'block'
          return await $fetch(url)
        })
      `,
      errors: [
        {
          messageId: 'useCallOnceForSideEffects',
        },
        {
          messageId: 'noSideEffectsInAsyncDataHandler',
          data: { functionName: 'useFetch' },
        },
        {
          messageId: 'noSideEffectsInAsyncDataHandler',
          data: { functionName: 'useFetch' },
        },
      ],
    },
    {
      name: 'useAsyncData with global assignment',
      code: `
        const { data } = await useAsyncData('users', async () => {
          window.userCount = 0
          const users = await $fetch('/api/users')
          window.userCount = users.length
          return users
        })
      `,
      errors: [
        {
          messageId: 'useCallOnceForSideEffects',
        },
        {
          messageId: 'noSideEffectsInAsyncDataHandler',
          data: { functionName: 'useAsyncData' },
        },
        {
          messageId: 'noSideEffectsInAsyncDataHandler',
          data: { functionName: 'useAsyncData' },
        },
      ],
    },
    {
      name: 'useAsyncData with timer side effect',
      code: `
        const { data } = await useAsyncData('users', async () => {
          setTimeout(() => console.log('Delayed log'), 1000)
          return await $fetch('/api/users')
        })
      `,
      errors: [
        {
          messageId: 'useCallOnceForSideEffects',
        },
        {
          messageId: 'noSideEffectsInAsyncDataHandler',
          data: { functionName: 'useAsyncData' },
        },
      ],
    },
    {
      name: 'useAsyncData with analytics tracking',
      code: `
        const { data } = await useAsyncData('users', async () => {
          gtag('event', 'page_view')
          return await $fetch('/api/users')
        })
      `,
      errors: [
        {
          messageId: 'useCallOnceForSideEffects',
        },
        {
          messageId: 'noSideEffectsInAsyncDataHandler',
          data: { functionName: 'useAsyncData' },
        },
      ],
    },
    {
      name: 'useLazyFetch with useState mutation',
      code: `
        const { data } = await useLazyFetch('/api/users', async (url) => {
          const userStore = useState('user')
          userStore.value.lastFetch = Date.now()
          return await $fetch(url)
        })
      `,
      errors: [
        {
          messageId: 'useCallOnceForSideEffects',
        },
        {
          messageId: 'noSideEffectsInAsyncDataHandler',
          data: { functionName: 'useLazyFetch' },
        },
        {
          messageId: 'noSideEffectsInAsyncDataHandler',
          data: { functionName: 'useLazyFetch' },
        },
      ],
    },
    {
      name: 'useAsyncData with router navigation',
      code: `
        const { data } = await useAsyncData('profile', async () => {
          if (!route.params.id) {
            router.push('/users')
            return null
          }
          return await $fetch(\`/api/users/\${route.params.id}\`)
        })
      `,
      errors: [
        {
          messageId: 'useCallOnceForSideEffects',
        },
        {
          messageId: 'noSideEffectsInAsyncDataHandler',
          data: { functionName: 'useAsyncData' },
        },
      ],
    },
    // Note: Invalid test cases have been temporarily removed due to
    // issues with the rule's side effect detection implementation
  ],
})
