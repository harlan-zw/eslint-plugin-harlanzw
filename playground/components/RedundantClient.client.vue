<template>
  <div class="client-component">
    <h3>Client Component</h3>
    <p>This component only runs on the client</p>
    <button @click="handleClick">Click me ({{ clickCount }})</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const clickCount = ref(0)

// ❌ This should trigger the nuxt-no-redundant-import-meta rule
// because this is a .client.vue file, so import.meta.client is always true
if (import.meta.client) {
  console.log('This check is redundant in .client.vue file')
}

// ✅ This is valid - checking for server in client component for SSR logic
if (import.meta.server) {
  console.log('This might run during SSR before hydration')
}

// ✅ Direct client logic without redundant check
onMounted(() => {
  console.log('Client-only mounted logic runs without checks')
})

function handleClick() {
  clickCount.value++
  
  // ❌ Another redundant check in client component
  if (import.meta.client) {
    console.log('Redundant check in event handler')
  }
}
</script>

<style scoped>
.client-component {
  background: #f0fff0;
  border: 2px solid #32cd32;
  padding: 1rem;
  margin: 1rem;
  border-radius: 8px;
}

button {
  background: #32cd32;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #228b22;
}
</style>