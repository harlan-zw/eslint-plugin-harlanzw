<template>
  <div>
    <h1>link-lowercase</h1>
    <p>This rule ensures link URLs do not contain uppercase characters.</p>
    
    <h2>❌ Bad - URLs with uppercase characters</h2>
    <div class="example">
      <!-- These should trigger the ESLint rule -->
      <a href="/Page">Page with uppercase P</a>
      <NuxtLink to="/About-Us">About Us page</NuxtLink>
      <RouterLink to="/Contact-Page">Contact page</RouterLink>
      <a href="/API/Endpoint">API endpoint</a>
      <a href="/User/Profile">User profile</a>
    </div>
    
    <h2>✅ Good - Lowercase URLs</h2>
    <div class="example">
      <a href="/page">Page with lowercase</a>
      <NuxtLink to="/about-us">About Us page</NuxtLink>
      <RouterLink to="/contact-page">Contact page</RouterLink>
      <a href="/api/endpoint">API endpoint</a>
      <a href="/user/profile">User profile</a>
    </div>

    <h2>✅ Good - Already lowercase URLs</h2>
    <div class="example">
      <a href="/home">Home page</a>
      <NuxtLink to="/products">Products</NuxtLink>
      <RouterLink to="/services">Services</RouterLink>
      <a href="/blog/latest">Latest blog</a>
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
// const badLink = <a href="/BadLink">Bad</a>
// const goodLink = <a href="/badlink">Good</a>
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