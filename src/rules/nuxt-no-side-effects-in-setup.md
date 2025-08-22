# nuxt-no-side-effects-in-setup

Enforce that side effects are moved to `onMounted` to avoid memory leaks during SSR.

## Rule Details

This rule prevents side effects from being executed in the root scope of Vue `<script setup>` blocks, as these can cause memory leaks during Server-Side Rendering (SSR). Side effects create persistent resources that won't be properly cleaned up during SSR since cleanup hooks like `onUnmounted` are never called.

### Why This Rule Exists

In Nuxt SSR, components are rendered on the server but never actually unmounted in the traditional sense. This means:

1. **Memory Leaks**: Side effects in setup scope create resources that persist in memory
2. **No Cleanup**: `onUnmounted` hooks are never called during SSR
3. **Accumulating Resources**: With each request, more resources accumulate without being cleaned up

This rule is based on the official Nuxt documentation guidance: *"You should avoid code that produces side effects that need cleanup in root scope of `<script setup>`. Move your side-effect code into `onMounted` instead."*

## Detected Side Effects

The rule detects these side effect functions when used in Vue script setup scope:

### Timer Functions
- `setTimeout()` / `setInterval()`
- `requestAnimationFrame()` / `requestIdleCallback()`

### Observer APIs
- `new IntersectionObserver()`
- `new MutationObserver()`
- `new ResizeObserver()`
- `new PerformanceObserver()`

### Network/Streaming
- `new WebSocket()`
- `new EventSource()`

## ❌ Incorrect

```vue
<script setup>
// ❌ Timer in setup scope - memory leak during SSR
const timer = setTimeout(() => {
  console.log('This will leak memory')
}, 1000)

// ❌ Observer in setup scope - memory leak during SSR
const observer = new IntersectionObserver((entries) => {
  console.log('Intersection detected')
})

// ❌ Animation frame in setup scope - memory leak during SSR
const frameId = requestAnimationFrame(() => {
  console.log('Animation frame')
})

// ❌ WebSocket in setup scope - memory leak during SSR
const ws = new WebSocket('ws://localhost:8080')
</script>
```

## ✅ Correct

```vue
<script setup>
// ✅ Side effects moved to onMounted with proper cleanup
onMounted(() => {
  const timer = setTimeout(() => {
    console.log('This is properly cleaned up')
  }, 1000)

  onUnmounted(() => {
    clearTimeout(timer)
  })
})

// ✅ Observer with proper cleanup
onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    console.log('Intersection detected')
  })

  // Observe some element
  observer.observe(document.getElementById('target'))

  onUnmounted(() => {
    observer.disconnect()
  })
})

// ✅ Animation with proper cleanup
onMounted(() => {
  const frameId = requestAnimationFrame(() => {
    console.log('Animation frame')
  })

  onUnmounted(() => {
    cancelAnimationFrame(frameId)
  })
})

// ✅ WebSocket with proper cleanup
onMounted(() => {
  const ws = new WebSocket('ws://localhost:8080')

  onUnmounted(() => {
    ws.close()
  })
})

// ✅ Side effects inside functions are allowed
function setupTimer() {
  return setTimeout(() => {
    console.log('Inside function is fine')
  }, 1000)
}
</script>
```

## Auto-fix

This rule provides automatic fixes that wrap side effects in `onMounted()` with appropriate cleanup in `onUnmounted()`:

### Timer Functions
```vue
<!-- Before -->
<script setup>
const timer = setTimeout(() => console.log('hello'), 1000)
</script>

<!-- After auto-fix -->
<script setup>
onMounted(() => {
  const timer = setTimeout(() => console.log('hello'), 1000)

  onUnmounted(() => {
    clearTimeout(timer)
  })
})
</script>
```

### Observer APIs
```vue
<!-- Before -->
<script setup>
const observer = new IntersectionObserver(() => {})
</script>

<!-- After auto-fix -->
<script setup>
onMounted(() => {
  const observer = new IntersectionObserver(() => {})

  onUnmounted(() => {
    observer.disconnect()
  })
})
</script>
```

### Network Connections
```vue
<!-- Before -->
<script setup>
const ws = new WebSocket('ws://localhost:8080')
</script>

<!-- After auto-fix -->
<script setup>
onMounted(() => {
  const connection = new WebSocket('ws://localhost:8080')

  onUnmounted(() => {
    connection.close()
  })
})
</script>
```

## When Not to Use

This rule is specifically designed for Nuxt applications that use SSR. If you're building a client-side-only application, the memory leak concerns don't apply, though the pattern is still a good practice.

## Options

This rule has no options.

## Implementation

- ⚠️ **Rule severity**: Warning (allows existing code to work while encouraging best practices)
- 🔧 **Auto-fixable**: Yes (automatically wraps side effects in `onMounted` with appropriate cleanup)
- 💭 **Suggestions**: No

## Further Reading

- [Nuxt Lifecycle Documentation](https://nuxt.com/docs/guide/concepts/nuxt-lifecycle)
- [Vue Composition API - Lifecycle Hooks](https://vuejs.org/api/composition-api-lifecycle.html)
- [MDN - Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) (for understanding cleanup patterns)

## Related Rules

- [`nuxt-await-navigate-to`](./nuxt-await-navigate-to.md) - Enforces awaiting `navigateTo()` calls
- [`vue-no-faux-composables`](./vue-no-faux-composables.md) - Prevents fake composables without reactivity
