<script setup>
import { nonAwaitedNavigateTo } from "../composables/useNonAwaitedNavigateTo.js";

await navigateTo('/')

const { foo } = reactive({ foo: 'bar' })
console.log(foo)

nonAwaitedNavigateTo()
</script>

<template>
  <div>
    <h1>nuxt-await-navigate-to</h1>
    <p>This page demonstrates the nuxt-await-navigate-to rule.</p>
    <p>Check the script section for examples of correct and incorrect usage.</p>

    <div>
      <h2>Rule Requirements:</h2>
      <ul>
        <li>Top-level <code>navigateTo()</code> calls must be awaited</li>
        <li>Function-level <code>navigateTo()</code> calls must be awaited or returned</li>
      </ul>
    </div>

    <div>
      <h2>Examples in this file:</h2>
      <ul>
        <li>❌ <code>useNonAwaitedNavigateTo()</code> - missing await/return</li>
        <li>❌ <code>useNonAwaitedNavigateToConditional()</code> - missing await/return in condition</li>
        <li>❌ Top-level <code>navigateTo('/top-level')</code> - missing await</li>
        <li>✅ <code>useAwaitedNavigateTo()</code> - properly awaited</li>
        <li>✅ <code>useReturnedNavigateTo()</code> - properly returned</li>
        <li>✅ <code>useConditionalCorrect()</code> - properly awaited/returned in conditions</li>
        <li>✅ Top-level <code>await navigateTo('/top-level-correct')</code> - properly awaited</li>
      </ul>
    </div>
  </div>
</template>
