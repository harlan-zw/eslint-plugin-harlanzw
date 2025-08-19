# nuxt-await-navigate-to

Enforce that `navigateTo()` calls are properly awaited or returned.

When using Nuxt's `navigateTo()` function, it returns a Promise that should be handled properly to ensure navigation works correctly and to avoid potential race conditions.

## Rule Details

This rule enforces two requirements:

1. **Top-level usage** (Vue script setup): `navigateTo()` calls must be awaited
2. **Function usage**: `navigateTo()` calls must be either awaited or returned

## Wrong

```vue
<script setup>
// ❌ Missing await at top level
navigateTo('/')

function handleNavigation() {
  // ❌ Missing await or return in function
  navigateTo('/dashboard')
}

async function asyncHandler() {
  // ❌ Missing await or return
  navigateTo('/async')
}
</script>
```

## Right

```vue
<script setup>
// ✅ Properly awaited at top level
await navigateTo('/')

async function handleNavigationAwaited() {
  // ✅ Properly awaited in function
  await navigateTo('/dashboard')
}

function handleNavigationReturned() {
  // ✅ Properly returned from function
  return navigateTo('/dashboard')
}

async function conditionalNavigation(condition) {
  if (condition) {
    // ✅ Properly awaited
    await navigateTo('/path-a')
  }
  else {
    // ✅ Properly returned
    return navigateTo('/path-b')
  }
}
</script>
```

## When to Use

This rule is particularly useful for:

- **Nuxt applications** using the `navigateTo()` composable
- **Vue script setup** contexts where navigation happens at the top level
- **Function components** that perform navigation

## Why This Matters

Properly handling `navigateTo()` promises ensures:

1. **Predictable navigation** - The navigation completes before other code runs
2. **Error handling** - Await allows you to catch navigation errors
3. **Performance** - Prevents unnecessary re-renders or duplicate navigations
4. **Type safety** - TypeScript can better infer return types

## Examples

### Top-level Usage

```vue
<script setup>
// Check authentication and redirect if needed
const { user } = await getCurrentUser()
if (!user) {
  // ✅ Must be awaited at top level
  await navigateTo('/login')
}
</script>
```

### Function Usage

```vue
<script setup>
// Event handler with await
async function onLogin() {
  try {
    await login()
    // ✅ Awaited in async function
    await navigateTo('/dashboard')
  }
  catch (error) {
    console.error('Login failed:', error)
  }
}

// Event handler with return
function onLogout() {
  logout()
  // ✅ Returned from function
  return navigateTo('/login')
}
</script>
```

### Complex Scenarios

```vue
<script setup>
function handleConditionalNavigation(userRole) {
  switch (userRole) {
    case 'admin':
      // ✅ Returned
      return navigateTo('/admin')
    case 'user':
      // ✅ Returned
      return navigateTo('/dashboard')
    default:
      // ✅ Returned
      return navigateTo('/onboarding')
  }
}

async function handleAsyncNavigation() {
  const data = await fetchUserData()

  if (data.needsSetup) {
    // ✅ Awaited
    await navigateTo('/setup')
  }
  else {
    // ✅ Awaited
    await navigateTo('/dashboard')
  }
}
</script>
```
