<script setup>
defineProps({
  count: Number,
  message: String,
})

onMounted(() => {
  const timer = setTimeout(() => {
  console.log('This will not be cleaned up during SSR')
}, 5055)

  onUnmounted(() => {
    clearTimeout(timer)
  })
})

// Timer in setup scope - won't be cleaned up during SSR
const timer = await new Promise(resolve => setTimeout(resolve(), 5055))

console.log(timer)
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Message: {{ message }}</p>
  </div>
</template>
