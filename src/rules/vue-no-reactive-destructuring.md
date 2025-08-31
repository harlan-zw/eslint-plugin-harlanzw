# vue-no-reactive-destructuring

Disallow destructuring reactive objects as it loses reactivity.

## Rule Details

This rule prevents destructuring a `reactive()` object directly, as this loses reactivity. When you destructure a reactive object, the extracted values become plain values and lose their reactive properties.

### ❌ Incorrect

```js
import { reactive } from 'vue'

// Loses reactivity - count and name are plain values
const { count, name } = reactive({ count: 0, name: 'John' })

// Array destructuring also loses reactivity
const [first, second] = reactive([1, 2])
```

### ✅ Correct

```js
import { reactive, toRefs } from 'vue'

// Maintains reactivity using toRefs
const { count, name } = toRefs(reactive({ count: 0, name: 'John' }))

// Or access properties directly
const state = reactive({ count: 0, name: 'John' })
console.log(state.count) // ✅ Still reactive

// Using reactive without destructuring
const state = reactive({ count: 0, name: 'John' })
const count = state.count // ✅ Reactive access
```

## Why?

When you destructure a `reactive()` object:

```js
const { count } = reactive({ count: 0 })
```

The `count` variable becomes a plain number, not a reactive reference. Changes to the original reactive object won't be reflected in the destructured variable, and changes to the destructured variable won't update the reactive object.

## Fix

The rule provides an automatic fix that wraps the `reactive()` call with `toRefs()`:

```js
// Before (loses reactivity)
const { count, name } = reactive({ count: 0, name: 'John' })

// After (maintains reactivity)
const { count, name } = toRefs(reactive({ count: 0, name: 'John' }))
```

`toRefs()` converts all properties of a reactive object to individual refs, preserving reactivity when destructured.

## When Not To Use

This rule should not be disabled as losing reactivity is almost always unintentional and leads to bugs. However, if you genuinely need plain values (rare), you can use `toRaw()` to make the intent explicit:

```js
// Explicit conversion to plain values
const { count, name } = toRaw(reactive({ count: 0, name: 'John' }))
```
