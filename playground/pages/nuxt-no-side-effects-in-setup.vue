<template>
  <div>
    <h1>nuxt-no-side-effects-in-setup</h1>
    <p>This rule prevents side effects in Vue setup functions, requiring them to be wrapped in onMounted/onUnmounted lifecycle hooks.</p>
    
    <h2>Invalid Examples (should trigger ESLint errors):</h2>
    <pre>{{ invalidExamples }}</pre>
    
    <h2>Valid Examples:</h2>
    <pre>{{ validExamples }}</pre>
    
    <p>Count: {{ count }}</p>
    <p>Loading: {{ isLoading }}</p>
    <p>Data: {{ data }}</p>
  </div>
</template>

<script setup>
// INVALID EXAMPLES - These should trigger ESLint errors:

// ❌ setTimeout at top level in Vue script setup
const timer = setTimeout(() => {
  console.log('tick')
}, 1000)

// ❌ setInterval at top level in Vue script setup
const intervalTimer = setInterval(() => {
  console.log('interval tick')
}, 1000)

// ❌ setTimeout without variable assignment
setTimeout(() => {
  console.log('side effect')
}, 1000)

// ❌ setInterval without variable assignment
setInterval(() => {
  console.log('interval side effect')
}, 1000)

// ❌ requestAnimationFrame at top level
const animationId = requestAnimationFrame(() => {
  console.log('animate')
})

// ❌ IntersectionObserver at top level
const observer = new IntersectionObserver((entries) => {
  console.log('intersection', entries)
})

// ❌ WebSocket at top level
const ws = new WebSocket('ws://localhost:8080')

// ❌ setTimeout in top-level conditional
if (someCondition) {
  setTimeout(() => {
    console.log('conditional timer')
  }, 1000)
}

// ❌ setTimeout mixed with other setup code
const router = useRouter()
const count = ref(0)

setTimeout(() => {
  count.value++
}, 1000)

watch(count, (newVal) => {
  console.log('Count changed:', newVal)
})

// ❌ setTimeout in a Vue SFC script setup context
const isLoading = ref(true)
const data = ref(null)

// This timer should be in onMounted
setTimeout(() => {
  isLoading.value = false
  data.value = 'loaded'
}, 3000)

const compute = computed(() => {
  return data.value?.toUpperCase()
})

// VALID EXAMPLES - These should NOT trigger ESLint errors:

// ✅ setTimeout inside onMounted is fine
onMounted(() => {
  const timer = setTimeout(() => {
    console.log('tick')
  }, 1000)
  
  onUnmounted(() => {
    clearTimeout(timer)
  })
})

// ✅ setInterval inside onMounted is fine
onMounted(() => {
  const timer = setInterval(() => {
    console.log('interval tick')
  }, 1000)
  
  onUnmounted(() => {
    clearInterval(timer)
  })
})

// ✅ setTimeout inside other functions is fine
function handleClick() {
  setTimeout(() => {
    console.log('delayed action')
  }, 500)
}

// ✅ setInterval inside other functions is fine
function handleInterval() {
  setInterval(() => {
    console.log('interval action')
  }, 500)
}

// ✅ setTimeout inside arrow functions is fine
const delay = () => {
  setTimeout(() => {
    console.log('arrow delay')
  }, 1000)
}

// ✅ setTimeout inside async functions is fine
async function asyncDelay() {
  setTimeout(() => {
    console.log('async delay')
  }, 1000)
}

// ✅ Observer inside onMounted is fine
onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    console.log(entries)
  })
  
  onUnmounted(() => {
    observer.disconnect()
  })
})

// ✅ WebSocket inside functions is fine
function connectWebSocket() {
  const ws = new WebSocket('ws://localhost:8080')
  return ws
}

// ✅ Other function calls in setup (non-side effects)
const route = useRoute()
const setupCount = ref(0)
console.log('setup code')

const invalidExamples = `
// ❌ setTimeout at top level in Vue script setup
const timer = setTimeout(() => {
  console.log('tick')
}, 1000)

// ❌ setInterval at top level in Vue script setup
const intervalTimer = setInterval(() => {
  console.log('interval tick')
}, 1000)

// ❌ requestAnimationFrame at top level
const animationId = requestAnimationFrame(() => {
  console.log('animate')
})

// ❌ IntersectionObserver at top level
const observer = new IntersectionObserver((entries) => {
  console.log('intersection', entries)
})

// ❌ WebSocket at top level
const ws = new WebSocket('ws://localhost:8080')
`

const validExamples = `
// ✅ setTimeout inside onMounted is fine
onMounted(() => {
  const timer = setTimeout(() => {
    console.log('tick')
  }, 1000)
  
  onUnmounted(() => {
    clearTimeout(timer)
  })
})

// ✅ setTimeout inside other functions is fine
function handleClick() {
  setTimeout(() => {
    console.log('delayed action')
  }, 500)
}

// ✅ Other function calls in setup (non-side effects)
const route = useRoute()
const setupCount = ref(0)
console.log('setup code')
`
</script>