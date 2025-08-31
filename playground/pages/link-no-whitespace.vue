<template>
  <div>
    <h1>link-no-whitespace</h1>
    <p>This rule ensures link URLs do not contain whitespace characters.</p>
    
    <h2>❌ Bad - URLs with whitespace</h2>
    <div class="example">
      <!-- These should trigger the ESLint rule -->
      <a href="/path with spaces">Link with spaces</a>
      <NuxtLink to="/page with spaces">NuxtLink with spaces</NuxtLink>
      <RouterLink to="/router	page">RouterLink with tab</RouterLink>
      <a href="/multiple  spaces">Multiple spaces</a>
    </div>
    
    <h2>✅ Good - URL-encoded URLs</h2>
    <div class="example">
      <a href="/path%20with%20spaces">Link with spaces</a>
      <NuxtLink to="/page%20with%20spaces">NuxtLink with spaces</NuxtLink>
      <RouterLink to="/router%09page">RouterLink with tab</RouterLink>
      <a href="/multiple%20%20spaces">Multiple spaces</a>
    </div>

    <h2>✅ Good - Dynamic URLs (not checked)</h2>
    <div class="example">
      <NuxtLink :to="dynamicPath">Dynamic path</NuxtLink>
      <a :href="computedUrl">Computed URL</a>
    </div>
  </div>
</template>

<script setup>
const dynamicPath = ref('/some/path')
const computedUrl = computed(() => '/computed/path')

// This would also trigger the rule in JSX/TSX files
// const badLink = <a href="/bad link">Bad</a>
// const goodLink = <a href="/good%20link">Good</a>
</script>

<style scoped>
.example {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.example a, .example :deep(a) {
  display: block;
  margin: 0.5rem 0;
  color: #3498db;
  text-decoration: none;
}

.example a:hover, .example :deep(a:hover) {
  text-decoration: underline;
}

h1 {
  color: #2c3e50;
}

h2 {
  margin-top: 2rem;
}
</style>