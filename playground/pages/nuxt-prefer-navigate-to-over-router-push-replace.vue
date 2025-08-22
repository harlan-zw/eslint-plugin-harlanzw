<script setup>
// ❌ Examples that should trigger the rule (and can be auto-fixed)

// Basic router usage - should use navigateTo() instead
const router = useRouter()
router.push('/')
router.replace('/about')

// Router with complex arguments
router.push({ 
  path: '/user', 
  query: { id: '123' },
  hash: '#profile'
})

// Router replace with existing options
router.replace('/dashboard', { force: true })

// Different variable name
const $router = useRouter()
$router.push('/test')

// Router usage in functions
function handleNavigation() {
  const routerInFunction = useRouter()
  routerInFunction.push('/function-nav')
}

// Assignment expression instead of declaration
let routerVar
routerVar = useRouter()
routerVar.replace('/assigned')

// ✅ Examples that are correct and won't trigger the rule

// Using navigateTo directly (preferred)
await navigateTo('/correct')
navigateTo('/also-correct')
navigateTo({ path: '/user', query: { id: '456' } })
navigateTo('/replace-example', { replace: true })

// Router from different source (not useRouter)
const customRouter = getCustomRouter()
customRouter.push('/custom')

// Other router methods (not push/replace)
const routerForOther = useRouter()
routerForOther.go(-1)
routerForOther.back()

// Array push (not router)
const items = []
items.push('new-item')

// Button click handlers
function handleRouterClick() {
  // ❌ Should use navigateTo
  const routerInHandler = useRouter()
  routerInHandler.push('/clicked')
}

function handleCorrectClick() {
  // ✅ Correct approach
  navigateTo('/clicked-correct')
}
</script>

<template>
  <div>
    <h1>nuxt-prefer-navigate-to-over-router-push-replace</h1>
    <p>This page demonstrates the nuxt-prefer-navigate-to-over-router-push-replace rule.</p>
    <p>Check the script section for examples of correct and incorrect usage.</p>

    <div>
      <h2>Rule Purpose:</h2>
      <p>Enforces using <code>navigateTo()</code> instead of <code>router.push()</code> and <code>router.replace()</code> in Nuxt applications.</p>
    </div>

    <div>
      <h2>Auto-fix Transformations:</h2>
      <ul>
        <li><code>router.push('/path')</code> → <code>navigateTo('/path')</code></li>
        <li><code>router.replace('/path')</code> → <code>navigateTo('/path', { replace: true })</code></li>
        <li><code>router.replace('/path', options)</code> → <code>navigateTo('/path', { ...options, replace: true })</code></li>
      </ul>
    </div>

    <div>
      <h2>❌ Examples that trigger the rule:</h2>
      <ul>
        <li><code>const router = useRouter(); router.push('/')</code></li>
        <li><code>const router = useRouter(); router.replace('/about')</code></li>
        <li><code>const $router = useRouter(); $router.push('/test')</code></li>
        <li><code>routerVar = useRouter(); routerVar.replace('/assigned')</code></li>
        <li>Router usage inside functions</li>
        <li>Router with complex arguments</li>
      </ul>
    </div>

    <div>
      <h2>✅ Examples that are correct:</h2>
      <ul>
        <li><code>navigateTo('/')</code></li>
        <li><code>navigateTo('/about', { replace: true })</code></li>
        <li><code>const customRouter = getCustomRouter(); customRouter.push('/custom')</code></li>
        <li><code>router.go(-1)</code> and <code>router.back()</code></li>
        <li><code>array.push(item)</code> (not router related)</li>
      </ul>
    </div>

    <div>
      <h2>Interactive Examples:</h2>
      <button @click="handleRouterClick">
        ❌ Click me (uses router.push - should be flagged)
      </button>
      <br><br>
      <button @click="handleCorrectClick">
        ✅ Click me (uses navigateTo - correct)
      </button>
    </div>

    <div>
      <h2>Benefits of navigateTo():</h2>
      <ul>
        <li>🔄 Better SSR support</li>
        <li>🎯 Nuxt-specific navigation features</li>
        <li>🚀 Integrated with Nuxt middleware</li>
        <li>🛡️ Better error handling</li>
        <li>📱 Consistent navigation API</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
button {
  padding: 10px 20px;
  margin: 5px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

button:first-of-type {
  background-color: #fee;
  color: #c33;
  border: 1px solid #fcc;
}

button:last-of-type {
  background-color: #efe;
  color: #363;
  border: 1px solid #cfc;
}

ul {
  margin: 10px 0;
}

li {
  margin: 5px 0;
}

code {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

h2 {
  margin-top: 20px;
  color: #333;
}
</style>