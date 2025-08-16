<script setup>
const props = defineProps({
  count: Number,
  message: String,
  user: Object,
})

// This will trigger eslint error
const { count, message, user } = toRefs(props)
</script>

<template>
  <div>
    <h1>vue-no-torefs-on-props</h1>
    <p>Count: {{ count }}</p>
    <p>Message: {{ message }}</p>
  </div>
</template>
