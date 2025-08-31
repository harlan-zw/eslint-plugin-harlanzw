// Server-only utility file

// ❌ This should trigger the nuxt-no-redundant-import-meta rule
// because this is a .server.ts file, so import.meta.server is always true
if (import.meta.server) {
  console.log('Redundant server check in .server.ts file')
}

// ✅ This is valid - checking for client in server utility
if (import.meta.client) {
  console.log('This would run on client if this code was included in build')
}

// ✅ Direct server logic without redundant check  
export function getServerInfo() {
  console.log('Server utility function runs without checks')
  return {
    timestamp: Date.now(),
    environment: 'server',
    pid: process.pid
  }
}

// ❌ Another redundant check in function
export function processServerData(data: any) {
  if (import.meta.server) {
    console.log('Processing data on server - this check is redundant')
    return { ...data, processedOnServer: true }
  }
  return data
}