<script setup>
const count = ref(0)
const message = ref('Hello')
</script>

<template>
  <div>
    <h1>vue-no-ref-access-in-templates</h1>
    <!-- These will trigger eslint errors -->
    <p>Count: {{ count.value }}</p>
    <p>Message: {{ message.value }}</p>
  </div>
</template>
