// Client-only utility file

// ❌ This should trigger the nuxt-no-redundant-import-meta rule
// because this is a .client.js file, so import.meta.client is always true
if (import.meta.client) {
  console.log('Redundant client check in .client.js file')
}

// ✅ This is valid - checking for server in client utility
if (import.meta.server) {
  console.log('This would run during SSR if this code was included')
}

// ✅ Direct client logic without redundant check
export function initializeClientFeatures() {
  console.log('Client utility function runs without checks')
  
  // Setup client-only features
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
  }
}

function handleResize() {
  // ❌ Redundant check in client event handler
  if (import.meta.client) {
    console.log('Handling resize - this check is redundant')
  }
}

// ✅ Multiple redundant checks for comprehensive testing
export const clientConfig = {
  theme: import.meta.client ? 'dark' : 'light', // ❌ Redundant ternary
  features: getClientFeatures()
}

function getClientFeatures() {
  const features = []
  
  // ❌ Redundant check in conditional
  if (import.meta.client && typeof navigator !== 'undefined') {
    features.push('navigation')
  }
  
  return features
}