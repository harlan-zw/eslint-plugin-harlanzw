# vue-no-ref-access-in-templates

Don't use `.value` on refs in Vue templates.

Vue automatically unwraps refs in templates, so `count.value` becomes just `count`. This keeps your templates clean and follows Vue conventions.

## Wrong

```vue
<template>
  <div>{{ count.value }}</div>
  <input v-model="message.value">
  <button @click="count.value++">Increment</button>
</template>
```

## Right

```vue
<template>
  <div>{{ count }}</div>
  <input v-model="message">
  <button @click="count++">Increment</button>
</template>
```

For complex expressions, use computed properties:

```vue
<script setup>
const incrementedCount = computed(() => count.value + 1)
</script>

<template>
  <div>{{ incrementedCount }}</div>
</template>
```

That's it! Vue handles the unwrapping for you.
