# nuxt-no-random

Disallow `Math.random()`, `crypto.randomUUID()`, and `crypto.getRandomValues()` in SSR-rendered code to prevent hydration mismatches.

## Rule Details

`Math.random()` produces different values on each invocation. When code runs during both SSR and client hydration, the server-rendered HTML won't match the client-rendered DOM, causing a hydration mismatch.

A common example is shuffling a list during setup:

```js
items.value.sort(() => Math.random() - 0.5)
```

During SSR this produces one order, but during client hydration it produces a different order — Vue detects the mismatch and has to re-render the entire subtree.

### What Gets Flagged

The rule flags these calls when they **execute during component setup**:

- `Math.random()`
- `crypto.randomUUID()` / `window.crypto.randomUUID()` / `globalThis.crypto.randomUUID()`
- `crypto.getRandomValues()` / `window.crypto.getRandomValues()` / `globalThis.crypto.getRandomValues()`

Including inline callbacks that execute synchronously (e.g. `.sort()`, `.map()`, `.filter()`).

### What Is Allowed

The rule ignores calls in contexts that are **client-only** or **deferred**:

- Inside lifecycle hooks (`onMounted`, `onBeforeMount`, etc.)
- Inside `if (import.meta.client)` / `if (process.client)` guards and ternary equivalents
- Inside `if (typeof window !== 'undefined')` guards
- Inside `watch()` callbacks (deferred, not executed during setup)
- Inside named functions (event handlers, utility functions defined but not called during setup)
- Inside class methods
- Inside server handlers (`defineEventHandler`, `defineCachedEventHandler`, `defineNitroPlugin`, `defineTask`) — these never hydrate

## ❌ Incorrect

```vue
<script setup>
import { ref } from 'vue'

// ❌ Different value on server vs client
const randomValue = Math.random()

// ❌ Shuffles differently on server vs client
const items = ref([1, 2, 3, 4, 5])
items.value.sort(() => Math.random() - 0.5)

// ❌ Conditional rendering differs between server and client
const showBanner = Math.random() > 0.5

// ❌ crypto APIs are also non-deterministic
const id = crypto.randomUUID()
</script>

<template>
  <div>{{ randomValue }}</div>
  <div v-for="item in items" :key="item">{{ item }}</div>
  <Banner v-if="showBanner" />
</template>
```

## ✅ Correct

```vue
<script setup>
import { onMounted, ref } from 'vue'

const items = ref([1, 2, 3, 4, 5])
const showBanner = ref(false)

// ✅ Randomize after hydration in onMounted
onMounted(() => {
  items.value.sort(() => Math.random() - 0.5)
  showBanner.value = Math.random() > 0.5
})

// ✅ Guard with import.meta.client
if (import.meta.client) {
  items.value.sort(() => Math.random() - 0.5)
}

// ✅ Ternary client guard
const id = import.meta.client ? crypto.randomUUID() : ''

// ✅ Inside an event handler (only runs on client interaction)
function shuffle() {
  items.value.sort(() => Math.random() - 0.5)
}
</script>

<template>
  <div v-for="item in items" :key="item">{{ item }}</div>
  <Banner v-if="showBanner" />
  <button @click="shuffle">Shuffle</button>
</template>
```

### Alternative: Seeded Random

For cases where you need deterministic randomness during SSR (e.g. A/B testing), use a seeded PRNG instead:

```vue
<script setup>
import { seedRandom } from '~/utils/random' // your seeded PRNG

// ✅ Same seed produces same result on server and client
const rng = seedRandom(userId)
const variant = rng() > 0.5 ? 'A' : 'B'
</script>
```

## When Not to Use

- Client-only applications (`ssr: false` in Nuxt config) — hydration mismatches don't apply
- Code that intentionally differs between server and client (rare)

## Options

This rule has no options.

## Implementation

- ⚠️ **Rule severity**: Error
- 🔧 **Auto-fixable**: No (multiple valid solutions — `onMounted`, client guard, seeded random)
- 💭 **Suggestions**: No

## Further Reading

- [Nuxt Hydration Docs](https://nuxt.com/docs/guide/concepts/rendering#universal-rendering)
- [Vue Hydration Mismatch](https://vuejs.org/guide/scaling-up/ssr.html#hydration-mismatch)

## Related Rules

- [`nuxt-no-unsafe-date`](./nuxt-no-unsafe-date.md) - Prevents Date.now() / new Date() hydration mismatches
- [`nuxt-no-side-effects-in-setup`](./nuxt-no-side-effects-in-setup.md) - Prevents side effects that cause memory leaks during SSR
- [`nuxt-no-redundant-import-meta`](./nuxt-no-redundant-import-meta.md) - Prevents redundant client/server checks
