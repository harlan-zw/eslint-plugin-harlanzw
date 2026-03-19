# vue-no-reactivity-after-await

Don't call `watch()`, `computed()`, or other subscription APIs after `await` in async functions.

Vue ties watchers and computed properties to the current component instance. When you `await`, the synchronous execution context is lost — any subscription created afterward becomes orphaned and will never be auto-stopped on unmount.

## Wrong

```ts
async function setup() {
  await loadMapLibrary()
  // orphaned — created after await, outside component instance
  watch(() => props.options, handler, { deep: true })
}
```

```ts
whenever(() => mapReady.value, async () => {
  await importLibrary('marker')
  // orphaned — same problem inside async callbacks
  watch(() => props.options, handler)
  whenever(() => props.options, handler)
})
```

```ts
async function setup() {
  await fetchData()
  // orphaned computed — never cleaned up
  const doubled = computed(() => count.value * 2)
}
```

## Right

```ts
// Sync setup scope — Vue auto-stops these on unmount
watch(() => props.options, handler, { deep: true })
const doubled = computed(() => count.value * 2)

whenever(() => mapReady.value, async () => {
  await importLibrary('marker')
  // no subscriptions after await — good
})
```

```ts
// If you must create watchers after async work, use effectScope
const scope = effectScope()
async function setup() {
  await loadData()
  scope.run(() => {
    watch(() => props.options, handler)
  })
}
onScopeDispose(() => scope.stop())
```

Move all subscriptions before the first `await`, or wrap them in `effectScope()` for manual lifecycle control.
