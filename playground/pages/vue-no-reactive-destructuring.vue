<template>
  <div>
    <h1>vue-no-reactive-destructuring</h1>
    <p>This rule prevents destructuring reactive objects, which causes loss of reactivity. Use toRefs() instead.</p>
    
    <h2>Invalid Examples (should trigger ESLint errors):</h2>
    <pre>{{ invalidExamples }}</pre>
    
    <h2>Valid Examples:</h2>
    <pre>{{ validExamples }}</pre>
    
    <p>State Count: {{ state.count }}</p>
    <p>State Name: {{ state.name }}</p>
    <p>ToRefs Count: {{ toRefsCount }}</p>
    <p>ToRefs Name: {{ toRefsName }}</p>
  </div>
</template>

<script setup>
// INVALID EXAMPLES - These should trigger ESLint errors:

// ❌ Object destructuring of reactive
const { count, name } = reactive({ count: 0, name: "test" })

// ❌ Array destructuring of reactive  
const [first, second] = reactive([1, 2])

// ❌ Nested destructuring
const { user: { name: userName } } = reactive({ user: { name: "John" } })

// ❌ With default values
const { count: countWithDefault = 0, name: nameWithDefault = "default" } = reactive({ count: 5 })

// VALID EXAMPLES - These should NOT trigger ESLint errors:

// ✅ No destructuring
const state = reactive({ count: 0, name: "test" })

// ✅ Direct property access
const reactiveState = reactive({ count: 0 })
console.log(reactiveState.count)

// ✅ Using toRefs - maintains reactivity
const { count: toRefsCount, name: toRefsName } = toRefs(reactive({ count: 10, name: "toRefs test" }))

// ✅ Not a reactive call
const someObject = { count: 5 }
const { count: someCount } = someObject

// ✅ Different function call
const { count: refCount } = ref({ count: 0 })

// ✅ No destructuring with other patterns
const anotherState = reactive({ count: 0 })
const anotherCount = anotherState.count

const invalidExamples = `
// ❌ Object destructuring of reactive (loses reactivity)
const { count, name } = reactive({ count: 0, name: "test" })

// ❌ Array destructuring of reactive (loses reactivity)
const [first, second] = reactive([1, 2])

// ❌ Nested destructuring (loses reactivity)
const { user: { name: userName } } = reactive({ user: { name: "John" } })

// ❌ With default values (loses reactivity)
const { count = 0, name = "default" } = reactive({ count: 5 })
`

const validExamples = `
// ✅ No destructuring - maintains reactivity
const state = reactive({ count: 0, name: "test" })

// ✅ Direct property access - maintains reactivity
const reactiveState = reactive({ count: 0 })
console.log(reactiveState.count)

// ✅ Using toRefs - maintains reactivity
const { count, name } = toRefs(reactive({ count: 10, name: "toRefs test" }))

// ✅ Not a reactive call - no reactivity to lose
const someObject = { count: 5 }
const { count } = someObject

// ✅ No destructuring with other patterns
const anotherState = reactive({ count: 0 })
const anotherCount = anotherState.count
`
</script>