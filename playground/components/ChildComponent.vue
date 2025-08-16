<script setup>
defineProps({
  count: Number,
  message: String,
})
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Message: {{ message }}</p>
  </div>
</template>
