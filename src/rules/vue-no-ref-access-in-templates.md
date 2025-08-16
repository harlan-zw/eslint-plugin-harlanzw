# vue-no-ref-access-in-templates

Disallow accessing `ref.value` in Vue templates.

## Rule Details

This rule prevents the use of `.value` on Vue refs within template expressions. In Vue templates, refs are automatically unpacked, so accessing `.value` is unnecessary and goes against Vue's conventions.

Instead of accessing `ref.value` in templates, you should:
1. Use the ref directly in the template
2. Use computed properties for complex expressions involving refs

## Examples

❌ **Incorrect** code for this rule:

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)
const message = ref('Hello')
</script>

<template>
  <!-- Don't do this -->
  <div>{{ count.value }}</div>
  <input v-model="message.value">
  <button @click="count.value++">
    Increment
  </button>
</template>
```

✅ **Correct** code for this rule:

```vue
<script setup>
import { computed, ref } from 'vue'

const count = ref(0)
const message = ref('Hello')

// Use computed for complex expressions
const incrementedCount = computed(() => count.value + 1)
</script>

<template>
  <!-- Vue automatically unpacks refs in templates -->
  <div>{{ count }}</div>
  <input v-model="message">
  <button @click="count++">
    Increment
  </button>

  <!-- Complex expressions should use computed -->
  <div>{{ incrementedCount }}</div>
</template>
```

## When Not To Use It

This rule should not be used if you:
- Are not using Vue.js
- Need to access ref values outside of Vue templates (in script sections, this is still necessary)
- Are working with custom template systems that don't auto-unpack refs

## Implementation Note

This rule detects `ref.value` patterns within `html` tagged template literals, as this is a common pattern in Vue applications using template compilation or JSX-like syntax with TypeScript.
