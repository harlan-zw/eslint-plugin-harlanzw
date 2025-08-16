# use-composables-must-use-reactivity

Enforce that composables must use Vue reactivity APIs.

Vue composables should utilize Vue's reactivity system to provide reactive state and computed values. This rule ensures that functions following the composable naming convention (starting with "use") actually use Vue's reactivity APIs or call other composables.

## Rule Details

This rule checks that composable functions use at least one of the following:

**Vue reactivity APIs:**
- **Core:** `ref`, `reactive`, `computed`, `readonly`
- **Watchers:** `watch`, `watchEffect`, `watchPostEffect`, `watchSyncEffect`, `onWatcherCleanup`
- **Shallow variants:** `shallowRef`, `shallowReactive`, `shallowReadonly`
- **Utilities:** `toRef`, `toRefs`, `unref`, `toRaw`, `markRaw`
- **Type checking:** `isRef`, `isReactive`, `isReadonly`
- **Advanced:** `customRef`, `triggerRef`, `effectScope`, `getCurrentScope`, `onScopeDispose`

**Or call other composables:**
- Any function call where the function name starts with "use" (e.g., `useCounter()`, `useTimer()`)

### ❌ Incorrect

```js
import { someUtility } from 'vue'

// This composable doesn't use any reactivity APIs
function useCounter() {
  let count = 0

  function increment() {
    count++
  }

  return { count, increment }
}

// Arrow function composable without reactivity
function useTimer() {
  const time = Date.now()
  return { time }
}

// Calls regular function (not a composable)
function useHelper() {
  const result = regularFunction()
  return { result }
}

// Calls method (not a composable function)
function useMethodCall() {
  const result = obj.useSomething() // method call, not composable
  return { result }
}
```

### ✅ Correct

```js
import { computed, ref } from 'vue'

// Uses ref() for reactive state
function useCounter() {
  const count = ref(0)

  function increment() {
    count.value++
  }

  return { count, increment }
}

// Uses computed() for derived state
function useDoubledValue(value) {
  const doubled = computed(() => value.value * 2)
  return { doubled }
}

// Uses reactive() for complex state
function useUserState() {
  const state = reactive({
    user: null,
    loading: false
  })

  return { state }
}

// Calls another composable
function useComposedLogic() {
  const counter = useCounter()
  const timer = useTimer()

  return { counter, timer }
}

// Calls composable conditionally
function useConditionalLogic(isDev) {
  if (isDev) {
    return useDevMode()
  }
  return useProdMode()
}

// Uses advanced reactivity APIs
function useAdvancedReactivity() {
  const scope = effectScope()
  const state = reactive({ count: 0 })
  const raw = toRaw(state)

  watchPostEffect(() => {
    console.log('Post effect:', state.count)
  })

  return { scope, state, raw }
}
```

## Options

This rule has no options.

## When Not To Use It

If you have utility functions that follow the "use" naming convention but are not intended to be Vue composables, you may want to disable this rule for those specific functions or rename them to not start with "use".
