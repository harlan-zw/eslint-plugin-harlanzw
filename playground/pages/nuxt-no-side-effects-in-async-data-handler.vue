<template>
  <div>
    <h1>nuxt-no-side-effects-in-async-data-handler</h1>
    <p>This rule prevents side effects in async data handler functions like useAsyncData, useFetch, etc.</p>
    
    <h2>Invalid Examples (should trigger ESLint errors):</h2>
    <pre>{{ invalidExamples }}</pre>
    
    <h2>Valid Examples:</h2>
    <pre>{{ validExamples }}</pre>
  </div>
</template>

<script setup>
// INVALID EXAMPLES - These should trigger ESLint errors:

// ❌ Store mutation inside useAsyncData
const { data: _users1 } = await useAsyncData('users1', async () => {
  store.$patch({ loading: true }) // Side effect!
  return await $fetch('/api/users')
})

// ❌ Navigation side effect
const { data: _users2 } = await useAsyncData('users2', async () => {
  if (!user.isAuthenticated) {
    await navigateTo('/login') // Side effect!
  }
  return await $fetch('/api/users')
})

// ❌ DOM manipulation
const { data: _users3 } = await useFetch('/api/users', async (url) => {
  document.getElementById('loading').style.display = 'block' // Side effect!
  return await $fetch(url)
})

// ❌ Global assignment
const { data: _users4 } = await useAsyncData('users4', async () => {
  window.userCount = 0 // Side effect!
  const users = await $fetch('/api/users')
  window.userCount = users.length // Side effect!
  return users
})

// ❌ Timer side effect
const { data: _users5 } = await useAsyncData('users5', async () => {
  setTimeout(() => console.log('Delayed log'), 1000) // Side effect!
  return await $fetch('/api/users')
})

// ❌ Analytics tracking
const { data: _users6 } = await useAsyncData('users6', async () => {
  gtag('event', 'page_view') // Side effect!
  return await $fetch('/api/users')
})

// ❌ State mutation
const { data: _users7 } = await useLazyFetch('/api/users', async (url) => {
  const userStore = useState('user')
  userStore.value.lastFetch = Date.now() // Side effect!
  return await $fetch(url)
})

// ❌ Router navigation
const { data: _profile } = await useAsyncData('profile', async () => {
  if (!route.params.id) {
    router.push('/users') // Side effect!
    return null
  }
  return await $fetch(`/api/users/${route.params.id}`)
})

// VALID EXAMPLES - These should NOT trigger ESLint errors:

// ✅ Pure data fetching
const { data: _validUsers1 } = await useAsyncData('validUsers1', () => $fetch('/api/users'))

// ✅ Data transformation (no side effects)
const { data: _validUsers2 } = await useAsyncData('validUsers2', async () => {
  const response = await $fetch('/api/users')
  return response.data.map(user => ({ id: user.id, name: user.name }))
})

// ✅ Error handling (no side effects)
const { data: _validUsers3 } = await useAsyncData('validUsers3', async () => {
  try {
    return await $fetch('/api/users')
  } catch (error) {
    throw error
  }
})

// ✅ Conditional logic (no side effects)
const { data: _validUsers4 } = await useAsyncData('validUsers4', async () => {
  const endpoint = isAdmin ? '/api/admin/users' : '/api/users'
  return await $fetch(endpoint)
})

// ✅ Side effects in separate callOnce
const { data: _validUsers5 } = await useAsyncData('validUsers5', () => $fetch('/api/users'))

callOnce(async () => {
  await updateUserAnalytics()
  console.log('Analytics updated')
})

// ✅ Side effects in nested functions are allowed
const { data: _validUsers6 } = await useAsyncData('validUsers6', async () => {
  const processData = (data) => {
    console.log('Processing data') // This is inside a nested function, so it's allowed
    return data
  }
  
  const response = await $fetch('/api/users')
  return processData(response)
})

const invalidExamples = `
// ❌ Store mutation inside useAsyncData
const { data: _users1 } = await useAsyncData('users1', async () => {
  store.$patch({ loading: true }) // Side effect!
  return await $fetch('/api/users')
})

// ❌ Navigation side effect
const { data: _users2 } = await useAsyncData('users2', async () => {
  if (!user.isAuthenticated) {
    await navigateTo('/login') // Side effect!
  }
  return await $fetch('/api/users')
})

// ❌ DOM manipulation
const { data: _users3 } = await useFetch('/api/users', async (url) => {
  document.getElementById('loading').style.display = 'block' // Side effect!
  return await $fetch(url)
})

// ❌ Global assignment
const { data: _users4 } = await useAsyncData('users4', async () => {
  window.userCount = 0 // Side effect!
  const users = await $fetch('/api/users')
  window.userCount = users.length // Side effect!
  return users
})
`

const validExamples = `
// ✅ Pure data fetching
const { data: _validUsers1 } = await useAsyncData('validUsers1', () => $fetch('/api/users'))

// ✅ Data transformation (no side effects)
const { data: _validUsers2 } = await useAsyncData('validUsers2', async () => {
  const response = await $fetch('/api/users')
  return response.data.map(user => ({ id: user.id, name: user.name }))
})

// ✅ Side effects in separate callOnce
const { data: _validUsers5 } = await useAsyncData('validUsers5', () => $fetch('/api/users'))

callOnce(async () => {
  await updateUserAnalytics()
  console.log('Analytics updated')
})
`
</script>