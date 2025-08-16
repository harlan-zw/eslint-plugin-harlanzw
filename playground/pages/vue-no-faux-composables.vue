<script setup>
// These will trigger eslint errors
function useCounter() {
  const count = 0 // not reactive!
  return { count }
}

function useTimer() {
  return { time: Date.now() } // static value
}

const { count } = useCounter()
const { time } = useTimer()
</script>

<template>
  <div>
    <h1>vue-no-faux-composables</h1>
    <p>Count: {{ count }}</p>
    <p>Time: {{ time }}</p>
  </div>
</template>
