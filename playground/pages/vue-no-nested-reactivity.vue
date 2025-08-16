<script setup>
import { reactive, ref } from 'vue'

// These will trigger eslint errors
const state = reactive({
  count: ref(0), // ref inside reactive
  user: {
    name: ref('John'), // nested ref
  },
})

const data = ref(reactive({
  items: [],
}))
</script>

<template>
  <div>
    <h1>vue-no-nested-reactivity</h1>
    <p>Count: {{ state.count }}</p>
    <p>Name: {{ state.user.name }}</p>
    <p>Data: {{ data }}</p>
  </div>
</template>
