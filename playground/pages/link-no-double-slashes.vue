<template>
  <div>
    <h1>link-no-double-slashes</h1>
    <p>This rule ensures link URLs do not contain consecutive slashes in the path.</p>
    
    <h2>❌ Bad - URLs with double slashes</h2>
    <div class="example">
      <!-- These should trigger the ESLint rule -->
      <a href="/path//with//double">Double slashes in path</a>
      <NuxtLink to="/page//section">Page with double slash</NuxtLink>
      <RouterLink to="/router///page">Triple slashes</RouterLink>
      <a href="/path//to?query=1#hash">With query and hash</a>
      <a href="/multiple////slashes">Multiple consecutive slashes</a>
    </div>
    
    <h2>✅ Good - Single slashes</h2>
    <div class="example">
      <a href="/path/with/single">Single slashes</a>
      <NuxtLink to="/page/section">Page section</NuxtLink>
      <NuxtLink to="/router/page">Router page</NuxtLink>
      <a href="/path/to?query=1#hash">With query and hash</a>
      <a href="/clean/path/structure">Clean path</a>
    </div>

    <h2>✅ Good - External URLs (ignored)</h2>
    <div class="example">
      <a href="//example.com/path">Protocol-relative URL</a>
      <a href="https://example.com/path">Full URL with protocol</a>
      <NuxtLink to="https://external.com//path">External with double slash</NuxtLink>
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
// const badLink = <a href="/bad//link">Bad</a>
// const goodLink = <a href="/good/link">Good</a>
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