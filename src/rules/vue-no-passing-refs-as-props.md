# vue-no-passing-refs-as-props

Disallow passing refs as props to Vue components.

## Rule Details

This rule prevents passing Vue refs directly as props to components without unwrapping them first. When refs are passed as props without using `.value`, the receiving component gets a ref object instead of the actual value, which can lead to unexpected behavior and breaks Vue's reactivity system.

## Examples

❌ **Incorrect** code for this rule:

```ts
import { ref } from 'vue'

const state = {
  message: ref('Hello'),
  count: ref(0),
  isActive: ref(true)
}

// Don't pass refs directly
const template = html`
  <MyComponent :message="${state.message}" />
  <Counter :count="${state.count}" />
  <Status :active="${state.isActive}" />
`
```

✅ **Correct** code for this rule:

```ts
import { reactive, ref } from 'vue'

// Option 1: Use .value to unwrap refs
const state = {
  message: ref('Hello'),
  count: ref(0),
  isActive: ref(true)
}

const template = html`
  <MyComponent :message="${state.message.value}" />
  <Counter :count="${state.count.value}" />
  <Status :active="${state.isActive.value}" />
`

// Option 2: Use reactive() instead of refs in objects
const reactiveState = reactive({
  message: 'Hello',
  count: 0,
  isActive: true
})

const template2 = html`
  <MyComponent :message="${reactiveState.message}" />
  <Counter :count="${reactiveState.count}" />
  <Status :active="${reactiveState.isActive}" />
`

// Option 3: Direct refs (not in objects) with .value
const message = ref('Hello')
const template3 = html`<MyComponent :message="${message.value}" />`
```

## Why This Rule Exists

When you pass a ref without unwrapping it:

1. **Type Issues**: The prop receives a `Ref<T>` instead of `T`
2. **Reactivity Problems**: The component might not react to changes properly
3. **API Inconsistency**: Props should contain values, not reactive containers
4. **Performance**: Unnecessary ref objects are passed around

## Recommended Approach

Instead of storing refs in objects and passing them as props, consider:

1. **Use `reactive()`** for object state that needs to be passed as props
2. **Use `computed()`** for derived values that depend on refs
3. **Unwrap refs with `.value`** when you must pass individual ref values
4. **Restructure state** to avoid passing refs as props altogether

## When Not To Use It

This rule should not be used if you:
- Are not using Vue.js
- Are intentionally passing refs as props for advanced use cases
- Are working with custom reactive systems that expect ref objects

## Implementation Note

This rule detects ref properties within `html` tagged template literals, tracking objects that contain properties assigned with `ref()` calls.
