<template>
  <div class="server-component">
    <h3>Server Component</h3>
    <p>This component only runs on the server</p>
    <div>Data: {{ serverData }}</div>
  </div>
</template>

<script setup>
// ❌ This should trigger the nuxt-no-redundant-import-meta rule
// because this is a .server.vue file, so import.meta.server is always true
if (import.meta.server) {
  console.log('This check is redundant in .server.vue file')
}

// ✅ This is valid - checking for client in server component for hydration logic
if (import.meta.client) {
  console.log('This will run during hydration on client')
}

// ✅ Direct server logic without redundant check
const serverData = await $fetch('/api/server-data').catch(() => 'fallback')
console.log('Server-only logic runs without checks')
</script>

<style scoped>
.server-component {
  background: #f0f8ff;
  border: 2px solid #4682b4;
  padding: 1rem;
  margin: 1rem;
  border-radius: 8px;
}
</style>