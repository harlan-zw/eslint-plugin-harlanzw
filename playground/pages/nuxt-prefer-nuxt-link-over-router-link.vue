<template>
  <div>
    <h1>nuxt-prefer-nuxt-link-over-router-link</h1>
    <p>This rule prefers NuxtLink over RouterLink components in Nuxt applications.</p>
    
    <h2>❌ Bad - Using RouterLink</h2>
    <div class="example">
      <!-- This should trigger the ESLint rule -->
      <RouterLink to="/about">About Page</RouterLink>
      <RouterLink :to="{ name: 'home' }">Home</RouterLink>
      <router-link to="/contact">Contact</router-link>
    </div>
    
    <h2>✅ Good - Using NuxtLink</h2>
    <div class="example">
      <NuxtLink to="/about">About Page</NuxtLink>
      <NuxtLink :to="{ name: 'home' }">Home</NuxtLink>
      <NuxtLink to="/contact">Contact</NuxtLink>
    </div>
  </div>
</template>

<script setup>
// This would also trigger the rule in JSX/TSX files
// const badLink = <RouterLink to="/bad">Bad</RouterLink>
// const goodLink = <NuxtLink to="/good">Good</NuxtLink>
</script>

<style scoped>
.example {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

h1 {
  color: #2c3e50;
}

h2 {
  margin-top: 2rem;
}
</style>