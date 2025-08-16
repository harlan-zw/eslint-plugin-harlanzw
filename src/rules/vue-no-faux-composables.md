# vue-no-faux-composables

Functions starting with "use" should actually be composables.

If you're naming a function `useWhatever()`, it should use Vue's reactivity system or call other composables. Otherwise, it's just a regular function pretending to be a composable.

## Wrong

```ts
function useCounter() {
  let count = 0  // not reactive!
  return { count }
}

function useTimer() {
  return { time: Date.now() }  // static value
}
```

## Right

```ts
function useCounter() {
  const count = ref(0)  // actually reactive
  return { count }
}

function useComposed() {
  return useCounter()  // calls another composable
}
```

Use them in components:

```vue
<script setup>
const { count } = useCounter()
</script>

<template>
  <div>{{ count }}</div>
</template>
```

Real composables use things like `ref()`, `reactive()`, `computed()`, `watch()`, or call other `use*()` functions. If yours doesn't, maybe it shouldn't start with "use".
