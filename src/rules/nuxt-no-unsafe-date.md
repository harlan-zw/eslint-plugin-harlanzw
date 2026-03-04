# nuxt-no-unsafe-date

Disallow `Date.now()` and `new Date()` in SSR-rendered code to prevent hydration mismatches.

## Rule Details

`Date.now()` and `new Date()` (without arguments) return the current timestamp, which differs between the server render and client hydration. When used during component setup, the server-rendered HTML contains one time value while the client produces another, causing a hydration mismatch.

Nuxt 3.17+ ships the [`<NuxtTime>`](https://nuxt.com/docs/4.x/api/components/nuxt-time) component specifically to solve this problem — it renders dates consistently across SSR and client using the HTML `<time>` element.

### What Gets Flagged

- `Date.now()` executed during component setup
- `new Date()` with **no arguments** executed during component setup

### What Is Allowed

- `new Date('2024-01-01')` or `new Date(timestamp)` — deterministic, always safe
- Any Date call inside `onMounted`, lifecycle hooks, event handlers, or client guards
- Inside server handlers (`defineEventHandler`, `defineCachedEventHandler`, `defineNitroPlugin`, `defineTask`) — these never hydrate
- `Date.parse()` — deterministic

## ❌ Incorrect

```vue
<script setup>
// ❌ Different timestamp on server vs client
const now = new Date()
const timestamp = Date.now()

// ❌ Computed from current time — hydration mismatch
const greeting = Date.now() > 43200000 ? 'Good afternoon' : 'Good morning'
</script>

<template>
  <p>{{ now }}</p>
  <p>{{ greeting }}</p>
</template>
```

## ✅ Correct

```vue
<script setup>
import { onMounted, ref } from 'vue'

// ✅ Use <NuxtTime> for displaying dates (Nuxt 3.17+)
const createdAt = new Date('2024-06-15T10:30:00Z')

// ✅ Deterministic date from known value
const deadline = new Date(props.deadlineTimestamp)

// ✅ Defer to client with onMounted
const now = ref<Date | null>(null)
onMounted(() => {
  now.value = new Date()
})

// ✅ Guard with import.meta.client
const timestamp = import.meta.client ? Date.now() : 0
</script>

<template>
  <!-- ✅ NuxtTime handles SSR/client consistency automatically -->
  <NuxtTime :datetime="createdAt" year="numeric" month="long" day="numeric" />

  <!-- ✅ Relative time -->
  <NuxtTime :datetime="createdAt" relative />
</template>
```

## When Not to Use

- Client-only applications (`ssr: false` in Nuxt config)
- Pre-Nuxt 3.17 projects without access to `<NuxtTime>` (consider `onMounted` pattern instead)

## Options

This rule has no options.

## Implementation

- ⚠️ **Rule severity**: Warning
- 🔧 **Auto-fixable**: No (multiple valid solutions — `<NuxtTime>`, `onMounted`, client guard)
- 💭 **Suggestions**: No

## Further Reading

- [`<NuxtTime>` component](https://nuxt.com/docs/4.x/api/components/nuxt-time) — Nuxt's built-in hydration-safe time display
- [Vue Hydration Mismatch](https://vuejs.org/guide/scaling-up/ssr.html#hydration-mismatch)

## Related Rules

- [`nuxt-no-random`](./nuxt-no-random.md) - Prevents Math.random() and crypto random in SSR code
- [`nuxt-no-side-effects-in-setup`](./nuxt-no-side-effects-in-setup.md) - Prevents side effects that cause memory leaks during SSR
