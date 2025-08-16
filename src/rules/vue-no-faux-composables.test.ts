import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run } from './_test'
import rule, { RULE_NAME } from './vue-no-faux-composables'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Function declaration with ref
    $`
      import { ref } from 'vue'
      
      function useCounter() {
        const count = ref(0)
        return { count }
      }
    `,
    // Function declaration with reactive
    $`
      import { reactive } from 'vue'
      
      function useUserState() {
        const state = reactive({ user: null })
        return { state }
      }
    `,
    // Arrow function with computed
    $`
      import { computed } from 'vue'
      
      const useDoubledValue = (value) => {
        const doubled = computed(() => value.value * 2)
        return { doubled }
      }
    `,
    // Function with watch
    $`
      import { watch, ref } from 'vue'
      
      function useWatcher() {
        const value = ref(0)
        watch(value, () => {})
        return { value }
      }
    `,
    // Function with watchEffect
    $`
      import { watchEffect, ref } from 'vue'
      
      function useEffect() {
        const value = ref(0)
        watchEffect(() => console.log(value.value))
        return { value }
      }
    `,
    // Function with multiple reactivity APIs
    $`
      import { ref, computed, readonly } from 'vue'
      
      function useMultiple() {
        const count = ref(0)
        const doubled = computed(() => count.value * 2)
        const readonlyCount = readonly(count)
        return { count, doubled, readonlyCount }
      }
    `,
    // Exported function declaration
    $`
      import { ref } from 'vue'
      
      export function useExported() {
        const value = ref(0)
        return { value }
      }
    `,
    // Function with reactivity in object property
    $`
      import { ref } from 'vue'
      
      function useObjectProperty() {
        return {
          count: ref(0)
        }
      }
    `,
    // Function with reactivity in array
    $`
      import { ref } from 'vue'
      
      function useArrayElement() {
        return [ref(0), ref(1)]
      }
    `,
    // Non-composable function (doesn't start with 'use')
    $`
      function helper() {
        let count = 0
        return { count }
      }
    `,
    // Function with reactivity in nested statement
    $`
      import { ref } from 'vue'
      
      function useNested() {
        if (true) {
          const count = ref(0)
          return { count }
        }
      }
    `,
    // Function using other Vue APIs like toRef, toRefs
    $`
      import { toRef, toRefs } from 'vue'
      
      function useToRefs(props) {
        const name = toRef(props, 'name')
        const others = toRefs(props)
        return { name, others }
      }
    `,
    // Function using watchPostEffect and watchSyncEffect
    $`
      import { watchPostEffect, watchSyncEffect, ref } from 'vue'
      
      function useWatchVariants() {
        const count = ref(0)
        watchPostEffect(() => console.log(count.value))
        watchSyncEffect(() => console.log(count.value))
        return { count }
      }
    `,
    // Function using toRaw and markRaw
    $`
      import { toRaw, markRaw, reactive } from 'vue'
      
      function useRawUtils() {
        const state = reactive({ count: 0 })
        const raw = toRaw(state)
        const marked = markRaw({ data: 'test' })
        return { state, raw, marked }
      }
    `,
    // Function using effect scope APIs
    $`
      import { effectScope, getCurrentScope, onScopeDispose } from 'vue'
      
      function useEffectScope() {
        const scope = effectScope()
        const currentScope = getCurrentScope()
        onScopeDispose(() => {})
        return { scope, currentScope }
      }
    `,
    // Function using onWatcherCleanup
    $`
      import { watch, onWatcherCleanup, ref } from 'vue'
      
      function useWatcherWithCleanup() {
        const count = ref(0)
        watch(count, () => {
          onWatcherCleanup(() => {})
        })
        return { count }
      }
    `,
    // Function calling another composable
    $`
      function useComposed() {
        const result = useOtherComposable()
        return result
      }
    `,
    // Function calling multiple composables
    $`
      function useMultiComposed() {
        const counter = useCounter()
        const timer = useTimer()
        return { counter, timer }
      }
    `,
    // Function calling composable in nested statement
    $`
      function useConditionalComposable(condition) {
        if (condition) {
          return useSpecialCase()
        }
        return useDefaultCase()
      }
    `,
    // Function calling composable in object property
    $`
      function useObjectComposable() {
        return {
          counter: useCounter(),
          timer: useTimer()
        }
      }
    `,
    // Function calling composable in array
    $`
      function useArrayComposable() {
        return [useCounter(), useTimer()]
      }
    `,
  ],
  invalid: [
    // Function declaration without reactivity
    {
      code: $`
        import { someUtility } from 'vue'
        
        function useCounter() {
          let count = 0
          function increment() {
            count++
          }
          return { count, increment }
        }
      `,
      errors: [{
        messageId: 'mustUseReactivity',
        data: { name: 'useCounter' },
      }],
    },
    // Arrow function without reactivity
    {
      code: $`
        const useTimer = () => {
          let time = Date.now()
          return { time }
        }
      `,
      errors: [{
        messageId: 'mustUseReactivity',
        data: { name: 'useTimer' },
      }],
    },
    // Function expression without reactivity
    {
      code: $`
        const useHelper = function() {
          const value = 'static'
          return { value }
        }
      `,
      errors: [{
        messageId: 'mustUseReactivity',
        data: { name: 'useHelper' },
      }],
    },
    // Exported function without reactivity
    {
      code: $`
        export function useExported() {
          const value = 'static'
          return { value }
        }
      `,
      errors: [{
        messageId: 'mustUseReactivity',
        data: { name: 'useExported' },
      }],
    },
    // Function with Vue import but no reactivity usage
    {
      code: $`
        import { nextTick } from 'vue'
        
        function useAsync() {
          const value = 'static'
          nextTick(() => {})
          return { value }
        }
      `,
      errors: [{
        messageId: 'mustUseReactivity',
        data: { name: 'useAsync' },
      }],
    },
    // Function calling ref but not imported from Vue
    {
      code: $`
        import { ref } from 'some-other-library'
        
        function useOtherRef() {
          const value = ref(0)
          return { value }
        }
      `,
      errors: [{
        messageId: 'mustUseReactivity',
        data: { name: 'useOtherRef' },
      }],
    },
    // Function calling non-composable function (doesn't start with 'use')
    {
      code: $`
        function useHelper() {
          const result = helperFunction()
          return { result }
        }
      `,
      errors: [{
        messageId: 'mustUseReactivity',
        data: { name: 'useHelper' },
      }],
    },
    // Function calling method that starts with 'use' but is a method call
    {
      code: $`
        function useMethodCall() {
          const result = obj.useSomething()
          return { result }
        }
      `,
      errors: [{
        messageId: 'mustUseReactivity',
        data: { name: 'useMethodCall' },
      }],
    },
    // Multiple composables, some valid, some invalid
    {
      code: $`
        import { ref } from 'vue'
        
        function useGood() {
          const count = ref(0)
          return { count }
        }
        
        function useBad() {
          const value = 'static'
          return { value }
        }
      `,
      errors: [{
        messageId: 'mustUseReactivity',
        data: { name: 'useBad' },
      }],
    },
  ],
})
