# nuxt-no-unsafe-date

Disallow `Date.now()` and `new Date()` in SSR-rendered code to prevent hydration mismatches.

## Rule Details

`Date.now()` and `new Date()` (without arguments) return the current timestamp, which differs between the server render and client hydration. When used during component setup, the server-rendered HTML contains one time value while the client produces another, causing a hydration mismatch.

Nuxt 3.17+ ships the [`<NuxtTime>`](https://nuxt.com/docs/4.x/api/components/nuxt-time) component for this problem. It renders dates consistently across SSR and client using the HTML `<time>` element.

### What Gets Flagged

- `Date.now()` executed during component setup
- `new Date()` with **no arguments** executed during component setup
- Local calendar getters chained from `new Date()`: `getFullYear()`, `getMonth()`, `getDate()`, and `getDay()`

Local getters can disagree even when server rendering and hydration happen at the same instant. The server and browser may use different timezones.

### What Is Allowed

- `new Date('2024-01-01')` or `new Date(timestamp)`, which use a known input
- UTC calendar getters: `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`, and `getUTCDay()`
- Any Date call inside `onMounted`, lifecycle hooks, event handlers, or client guards
- Date calls inside server handlers such as `defineEventHandler`, which never hydrate
- `Date.parse()` with a fixed input

## ❌ Incorrect

```vue
<script setup>
// ❌ Different timestamp on server vs client
const now = new Date()
const timestamp = Date.now()

// ❌ Current time causes a hydration mismatch
const greeting = Date.now() > 43200000 ? 'Good afternoon' : 'Good morning'

// ❌ Uses the local timezone, which may differ between server and browser
const day = new Date().getDate()
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

// ✅ UTC getters do not depend on the browser timezone
const year = new Date().getUTCFullYear()

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

- **Rule severity**: Warning
- **Auto-fixable**: No. Valid solutions include `<NuxtTime>`, `onMounted`, and a client guard.
- **Suggestions**: No

## Further Reading

- [`<NuxtTime>` component](https://nuxt.com/docs/4.x/api/components/nuxt-time): Nuxt's built-in hydration-safe time display
- [Vue Hydration Mismatch](https://vuejs.org/guide/scaling-up/ssr.html#hydration-mismatch)

## Related Rules

- [`nuxt-no-random`](./nuxt-no-random.md): prevents random values in SSR code
- [`nuxt-no-side-effects-in-setup`](./nuxt-no-side-effects-in-setup.md): prevents side effects that cause memory leaks during SSR
