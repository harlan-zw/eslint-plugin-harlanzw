# vue-no-async-lifecycle-hook

Don't pass `async` callbacks to Vue lifecycle hooks.

Vue does not `await` lifecycle callbacks. If you pass an `async` function to `onBeforeUnmount`, `onMounted`, etc., any code after `await` runs as a detached microtask — it may not complete before the lifecycle phase ends, or may not run at all during unmount.

## Wrong

```ts
onBeforeUnmount(async () => {
  await Promise.all(cleanupMarkers())
  // may not execute during unmount — detached microtask
  map.value = undefined
})
```

```ts
onMounted(async () => {
  await loadData()
  // runs after mount phase completes — DOM may have changed
  initChart()
})
```

## Right

```ts
// Sync cleanup — guaranteed to run during unmount
onBeforeUnmount(() => {
  map.value?.unbindAll()
  map.value = undefined
})
```

```ts
// Move async work into the callback body without making the callback async
onMounted(() => {
  loadData().then(() => {
    initChart()
  })
})
```

```ts
// Or use a separate async function and handle errors
onMounted(() => {
  loadData()
    .then(initChart)
    .catch(handleError)
})
```

Note: `onServerPrefetch` is intentionally excluded — Vue awaits its callback.
