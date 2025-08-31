<template>
  <div class="demo-page">
    <h1>Redundant Import Meta Demo</h1>
    <p class="description">
      This page demonstrates the <code>nuxt-no-redundant-import-meta</code> ESLint rule.
      Check the browser console and ESLint output to see the rule in action.
    </p>

    <div class="examples">
      <h2>Examples</h2>
      
      <div class="example-section">
        <h3>✅ Valid Usage (No ESLint Errors)</h3>
        <p>Regular components can check both import.meta.server and import.meta.client:</p>
        <pre><code>// This file: pages/redundant-import-meta-demo.vue
if (import.meta.server) {
  console.log('Runs during SSR')
}

if (import.meta.client) {
  console.log('Runs on client')
}</code></pre>
      </div>

      <div class="example-section">
        <h3>❌ Invalid Usage (ESLint Errors Expected)</h3>
        <p>Scoped components with redundant checks:</p>
        <ul>
          <li><code>components/RedundantServer.server.vue</code> - Contains redundant <code>import.meta.server</code> checks</li>
          <li><code>components/RedundantClient.client.vue</code> - Contains redundant <code>import.meta.client</code> checks</li>
          <li><code>utils/server-helper.server.ts</code> - Contains redundant server checks</li>
          <li><code>utils/client-helper.client.js</code> - Contains redundant client checks</li>
        </ul>
      </div>
    </div>

    <div class="components-demo">
      <h2>Component Examples</h2>
      <RedundantServer />
      <RedundantClient />
    </div>

    <div class="instructions">
      <h2>To Test</h2>
      <ol>
        <li>Run <code>npm run lint</code> in the playground directory</li>
        <li>Look for ESLint errors about redundant import.meta checks</li>
        <li>Check browser console for log messages</li>
        <li>Compare with regular (non-scoped) components that have no ESLint errors</li>
      </ol>
    </div>
  </div>
</template>

<script setup>
// ✅ These are valid in regular (non-scoped) components
if (import.meta.server) {
  console.log('SSR: Running redundant-import-meta-demo on server')
}

if (import.meta.client) {
  console.log('Client: Running redundant-import-meta-demo on client')
}

// Import utilities to trigger their execution
if (process.client) {
  import('~/utils/client-helper.client.js').then(module => {
    module.initializeClientFeatures()
  })
}

if (process.server) {
  const { getServerInfo } = await import('~/utils/server-helper.server.ts')
  console.log('Server info:', getServerInfo())
}
</script>

<style scoped>
.demo-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: Arial, sans-serif;
}

.description {
  background: #f5f5f5;
  padding: 1rem;
  border-left: 4px solid #007acc;
  margin: 1rem 0;
}

.examples {
  margin: 2rem 0;
}

.example-section {
  margin: 1.5rem 0;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.example-section h3 {
  margin-top: 0;
}

.components-demo {
  margin: 2rem 0;
}

.instructions {
  background: #fff3cd;
  padding: 1.5rem;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  margin: 2rem 0;
}

pre {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}

code {
  background: #f1f3f4;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

ul li {
  margin: 0.5rem 0;
}

ol li {
  margin: 0.5rem 0;
}
</style>