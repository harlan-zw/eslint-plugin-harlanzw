# nuxt-no-side-effects-in-async-data-handler

Enforce that `useAsyncData` and `useFetch` handlers are side-effect free to ensure predictable SSR/CSR behavior.

The handler functions passed to `useAsyncData`, `useFetch`, and their lazy variants should be pure functions that only fetch and transform data. Side effects should be moved to `callOnce` utility or other appropriate lifecycle hooks.

## Rule Details

This rule detects side effects in handler functions and suggests using the `callOnce` utility for side effects that need to run during data fetching.

**Detected Side Effects:**
- Console logging and debugging calls
- Store/state mutations (Pinia, useState)
- Navigation calls (navigateTo, router methods)
- DOM manipulation (document methods, element modifications)
- Global variable assignments (window, global object properties)
- Timer functions (setTimeout, setInterval)
- Analytics/tracking calls (gtag, fbq, analytics APIs)

## Wrong

```vue
<script setup>
// ❌ Side effect in handler - console logging
const { data } = await useAsyncData('users', async () => {
  console.log('Fetching users')
  return await $fetch('/api/users')
})

// ❌ Side effect in handler - store mutation
const { data } = await useAsyncData('profile', async () => {
  store.$patch({ loading: true })
  const profile = await $fetch('/api/profile')
  store.$patch({ loading: false })
  return profile
})

// ❌ Side effect in handler - navigation
const { data } = await useAsyncData('protected', async () => {
  if (!user.isAuthenticated) {
    await navigateTo('/login')
  }
  return await $fetch('/api/protected')
})

// ❌ Side effect in handler - DOM manipulation
const { data } = await useFetch('/api/users', async (url) => {
  document.getElementById('loading').style.display = 'block'
  return await $fetch(url)
})

// ❌ Side effect in handler - global assignment
const { data } = await useAsyncData('stats', async () => {
  const stats = await $fetch('/api/stats')
  window.userStats = stats
  return stats
})

// ❌ Side effect in handler - analytics tracking
const { data } = await useAsyncData('page', async () => {
  gtag('event', 'page_view', { page_title: 'Dashboard' })
  return await $fetch('/api/page-data')
})
</script>
```

## Right

```vue
<script setup>
// ✅ Pure handler function - only data fetching and transformation
const { data } = await useAsyncData('users', async () => {
  const response = await $fetch('/api/users')
  return response.data.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email
  }))
})

// ✅ Side effects moved to callOnce
const { data } = await useAsyncData('profile', () => $fetch('/api/profile'))

callOnce(async () => {
  console.log('Profile data fetched')
  await updateUserAnalytics()
})

// ✅ Authentication check outside handler
if (!user.isAuthenticated) {
  await navigateTo('/login')
}

const { data } = await useAsyncData('protected', () => $fetch('/api/protected'))

// ✅ Loading state managed separately
const loading = ref(true)

const { data } = await useFetch('/api/users')
loading.value = false

// ✅ Analytics in separate callOnce
callOnce(() => {
  gtag('event', 'page_view', { page_title: 'Dashboard' })
})

const { data } = await useAsyncData('page', () => $fetch('/api/page-data'))

// ✅ Nested functions with side effects are allowed
const { data } = await useAsyncData('processed', async () => {
  const processData = (data) => {
    console.log('Processing data') // ✅ Allowed in nested function
    return data.filter(item => item.active)
  }

  const response = await $fetch('/api/data')
  return processData(response)
})
</script>
```

## When to Use

This rule is essential for:

- **Nuxt applications** using `useAsyncData`, `useFetch`, `useLazyFetch`, or `useLazyAsyncData`
- **SSR applications** where handler behavior must be consistent between server and client
- **Performance-critical** applications that need predictable data fetching behavior
- **Applications with complex state management** where side effects need careful coordination

## Why This Matters

Keeping handlers side-effect free ensures:

1. **SSR/CSR Consistency** - Handlers behave identically on server and client
2. **Predictable Caching** - Data fetching results are deterministic and cacheable
3. **Hydration Safety** - No mismatches between server-rendered and client-rendered state
4. **Performance** - Pure functions are easier for Nuxt to optimize and cache
5. **Debugging** - Side effects are isolated and easier to track down

## Alternative Patterns

### Use `callOnce` for Side Effects

```vue
<script setup>
// Pure data fetching
const { data: users } = await useAsyncData('users', () => $fetch('/api/users'))

// Side effects in callOnce
callOnce(async () => {
  // Analytics tracking
  gtag('event', 'users_loaded', { count: users.value?.length })

  // Store updates
  await userStore.updateLastFetch()

  // Notifications
  toast.success('Users loaded successfully')
})
</script>
```

### Use Lifecycle Hooks

```vue
<script setup>
const { data, pending } = await useAsyncData('data', () => $fetch('/api/data'))

// Loading states in watchers
watch(pending, (isPending) => {
  if (isPending) {
    showLoadingSpinner()
  }
  else {
    hideLoadingSpinner()
  }
})

// Side effects when data changes
watch(data, (newData) => {
  if (newData) {
    updatePageTitle(newData.title)
    trackAnalytics('data_loaded')
  }
})
</script>
```

### Conditional Data Fetching

```vue
<script setup>
// Handle conditions before the handler
if (!user.isAuthenticated) {
  await navigateTo('/login')
}

// Pure handler
const { data } = await useAsyncData('profile', () => $fetch('/api/profile'))
</script>
```

## Examples

### Complex Data Processing (Allowed)

```vue
<script setup>
// ✅ Complex pure transformations are fine
const { data } = await useAsyncData('dashboard', async () => {
  const [users, posts, analytics] = await Promise.all([
    $fetch('/api/users'),
    $fetch('/api/posts'),
    $fetch('/api/analytics')
  ])

  // Pure data transformation
  return {
    userCount: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    recentPosts: posts.slice(0, 5).map(p => ({
      id: p.id,
      title: p.title,
      excerpt: p.content.substring(0, 100)
    })),
    metrics: {
      totalViews: analytics.views,
      bounceRate: analytics.bounces / analytics.sessions
    }
  }
})
</script>
```

### Error Handling (Allowed)

```vue
<script setup>
// ✅ Error handling within handler is allowed
const { data } = await useAsyncData('api-data', async () => {
  try {
    return await $fetch('/api/data')
  }
  catch (error) {
    // Pure error handling - throwing is not a side effect
    if (error.statusCode === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Data not found'
      })
    }
    throw error
  }
})
</script>
```
