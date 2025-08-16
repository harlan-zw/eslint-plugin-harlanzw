<script setup>
import { ref } from 'vue'

const data = {
  count: ref(0),
  message: ref('Hello'),
}
</script>

<template>
  <div>
    <h1>vue-no-passing-refs-as-props</h1>
    <p>Count: {{ data.count }}</p>
    <!-- These will trigger eslint errors -->
    <ChildComponent :count="data.count" />
    <ChildComponent :message="data.message" />
  </div>
</template>
