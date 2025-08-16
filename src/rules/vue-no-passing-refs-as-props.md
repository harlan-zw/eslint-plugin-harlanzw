# vue-no-passing-refs-as-props

Don't pass refs as props - unwrap them first.

When you pass a ref to a component, pass the actual value, not the ref wrapper.

## Wrong

```vue
<script setup>
const message = ref('Hello')
</script>

<template>
  <MyComponent :message="message" />  <!-- passes ref object -->
</template>
```

## Right

```vue
<script setup>
const message = ref('Hello')
</script>

<template>
  <MyComponent :message="message.value" />  <!-- passes string -->
</template>
```

Or use reactive instead:

```vue
<script setup>
const state = reactive({ message: 'Hello' })
</script>

<template>
  <MyComponent :message="state.message" />
</template>
```

Components expect values, not ref wrappers. Always use `.value` when passing refs as props.
