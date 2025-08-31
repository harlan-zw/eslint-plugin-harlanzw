<template>
  <div>
    <h1>link-ascii-only</h1>
    <p>This rule ensures link URLs contain only ASCII characters.</p>
    
    <h2>❌ Bad - URLs with non-ASCII characters</h2>
    <div class="example">
      <!-- These should trigger the ESLint rule -->
      <a href="/página">Spanish page (á)</a>
      <NuxtLink to="/测试">Chinese test (测试)</NuxtLink>
      <RouterLink to="/café">French café (é)</RouterLink>
      <a href="/naïve">French naïve (ï)</a>
      <a href="/bücher">German bücher (ü)</a>
    </div>
    
    <h2>✅ Good - URL-encoded URLs</h2>
    <div class="example">
      <a href="/p%C3%A1gina">Spanish page</a>
      <NuxtLink to="/%E6%B5%8B%E8%AF%95">Chinese test</NuxtLink>
      <RouterLink to="/caf%C3%A9">French café</RouterLink>
      <a href="/na%C3%AFve">French naïve</a>
      <a href="/b%C3%BCcher">German bücher</a>
    </div>

    <h2>✅ Good - ASCII-only URLs</h2>
    <div class="example">
      <a href="/english-page">English page</a>
      <NuxtLink to="/test">Test page</NuxtLink>
      <RouterLink to="/contact">Contact page</RouterLink>
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
// const badLink = <a href="/página">Bad</a>
// const goodLink = <a href="/p%C3%A1gina">Good</a>
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