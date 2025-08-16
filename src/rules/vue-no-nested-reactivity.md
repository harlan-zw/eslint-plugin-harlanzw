# vue-no-nested-reactivity

Disallow nested reactivity patterns like `reactive({ foo: ref() })` or `ref({ foo: reactive() })`.

## Rule Details

This rule prevents nesting Vue 3 reactivity primitives within each other, which can lead to confusing behavior and performance issues. When you nest reactive APIs, you create unnecessary layers of reactivity that can cause unexpected behavior and make your code harder to understand.

## Examples

❌ **Incorrect** code for this rule:

```ts
import { reactive, ref } from 'vue'

// Don't nest ref inside reactive
const state = reactive({
  count: ref(0),
  message: ref('hello')
})

// Don't nest reactive inside ref
const data = ref({
  state: reactive({ count: 0 })
})
```

```ts
// Don't mix different reactive types with variables
const count = ref(0)
const state = reactive({
  count // This ref is nested in reactive
})

// Don't pass reactive variables to different reactive calls
const userRef = ref({ name: 'John' })
const appState = reactive(userRef)

// Don't return reactive primitives from computed
const computedRef = computed(() => ref(0))
const computedReactive = computed(() => reactive({ count: 0 }))
```

```ts
// Don't return reactive variables from computed
const count = ref(0)
const computedVar = computed(() => count)
```

✅ **Correct** code for this rule:

```ts
import { reactive, ref } from 'vue'

// Use ref for primitive values
const count = ref(0)
const message = ref('hello')

// Use reactive for objects
const state = reactive({
  count: 0,
  message: 'hello'
})

// Keep reactive types separate
const userState = reactive({ name: 'John' })
const counterState = reactive({ count: 0 })
```

```ts
// Use computed for derived values (return plain values, not reactive primitives)
import { computed } from 'vue'

const state = reactive({ count: 0 })
const doubled = computed(() => state.count * 2)
const message = computed(() => `Count is ${state.count}`)

// Same reactive type is allowed
const count1 = ref(0)
const count2 = ref(1)
```

## Why This Rule Exists

Nesting reactive primitives causes several issues:

1. **Performance Overhead**: Creates unnecessary reactive layers that impact performance
2. **Confusing Behavior**: Mixed reactivity patterns make it unclear how to access values
3. **Type Complexity**: Nested types like `Ref<Reactive<T>>` or `ComputedRef<Ref<T>>` are harder to work with
4. **Maintenance Issues**: Inconsistent patterns make code harder to understand and debug
5. **Vue Best Practices**: Goes against Vue 3 composition API recommendations
6. **Computed Confusion**: Computed should return derived values, not new reactive primitives

## Recommended Approach

Instead of nesting reactive primitives:

1. **Choose one pattern**: Use either `ref()` for primitives or `reactive()` for objects
2. **Consistent structure**: Keep related state in the same reactive container
3. **Use computed()**: For derived values that depend on reactive state
4. **Separate concerns**: Group related reactive state together

## Examples of Good Patterns

```ts
// Pattern 1: All refs
const name = ref('John')
const age = ref(25)
const isActive = ref(true)

// Pattern 2: Single reactive object
const user = reactive({
  name: 'John',
  age: 25,
  isActive: true
})

// Pattern 3: Separate reactive objects by domain
const userInfo = reactive({ name: 'John', age: 25 })
const userStatus = reactive({ isActive: true, lastSeen: Date.now() })
```

```ts
// Pattern 4: Computed for derived state (plain values only)
const user = reactive({ firstName: 'John', lastName: 'Doe' })
const fullName = computed(() => `${user.firstName} ${user.lastName}`)
const userAge = computed(() => calculateAge(user.birthDate))

// Pattern 5: Computed with complex objects (but not reactive primitives)
const userData = reactive({ name: 'John', scores: [80, 90, 95] })
const summary = computed(() => ({
  name: userData.name,
  average: userData.scores.reduce((a, b) => a + b) / userData.scores.length,
  grade: userData.scores.every(score => score >= 90) ? 'A' : 'B'
}))
```

## When Not To Use It

This rule should not be used if you:
- Are not using Vue.js
- Are working with custom reactive systems
- Have specific advanced use cases that require nested reactivity (very rare)

## Compatibility

This rule works with:
- `ref()` and `shallowRef()`
- `reactive()` and `shallowReactive()`
- `computed()` return value analysis
- `watch()` and `watchEffect()` nesting detection
- Variable tracking across scopes
- Deep object nesting detection
- Arrow function and function expression analysis
