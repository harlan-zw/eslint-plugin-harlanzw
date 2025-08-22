# nuxt-prefer-navigate-to-over-router-push-replace

Prefer `navigateTo()` over `router.push()` and `router.replace()` in Nuxt applications.

In Nuxt, `navigateTo()` is the recommended way to handle programmatic navigation. It provides better integration with Nuxt's routing system, SSR support, and follows Nuxt conventions.

## Rule Details

This rule warns when you use `router.push()` or `router.replace()` methods from `useRouter()` and suggests using `navigateTo()` instead.

**✨ This rule is auto-fixable** - ESLint can automatically convert router method calls to `navigateTo()`.

## Wrong

```js
const router = useRouter()

// ❌ Using router.push()
router.push('/')
router.push({ path: '/about', query: { id: '123' } })

// ❌ Using router.replace()
router.replace('/login')
router.replace({ name: 'dashboard' })
```

## Right

```js
// ✅ Using navigateTo()
navigateTo('/')
navigateTo({ path: '/about', query: { id: '123' } })

// ✅ Using navigateTo() with replace option
navigateTo('/login', { replace: true })
navigateTo({ name: 'dashboard' }, { replace: true })
```

## Auto-fix Transformations

The rule automatically transforms router method calls:

### `router.push()` → `navigateTo()`

```js
// Before
const router = useRouter()
router.push('/profile')

// After (auto-fixed)
const router = useRouter()
navigateTo('/profile')
```

### `router.replace()` → `navigateTo()` with replace option

```js
// Before
const router = useRouter()
router.replace('/dashboard')

// After (auto-fixed)
const router = useRouter()
navigateTo('/dashboard', { replace: true })
```

### Complex arguments are preserved

```js
// Before
router.push({
  path: '/user',
  query: { id: '123' },
  hash: '#profile'
})

// After (auto-fixed)
navigateTo({
  path: '/user',
  query: { id: '123' },
  hash: '#profile'
})
```

### `router.replace()` with existing options

```js
// Before
router.replace('/dashboard', { force: true })

// After (auto-fixed)
navigateTo('/dashboard', { ...{ force: true }, replace: true })
```

## When Not to Use

This rule only applies to router instances created by `useRouter()`. It won't flag:

- Router instances from other sources (e.g., custom router implementations)
- Other methods on router objects (`.go()`, `.back()`, etc.)
- Array `.push()` methods or other unrelated push/replace calls

## Why This Rule Exists

1. **Nuxt Convention**: `navigateTo()` is the official Nuxt way to handle programmatic navigation
2. **SSR Compatibility**: `navigateTo()` works seamlessly in both client and server environments
3. **Better Integration**: Provides better integration with Nuxt's middleware, error handling, and loading states
4. **Consistency**: Keeps navigation patterns consistent across your Nuxt application

## More Information

- [Nuxt navigateTo() documentation](https://nuxt.com/docs/api/utils/navigate-to)
- [Vue Router documentation](https://router.vuejs.org/guide/essentials/navigation.html)
