import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run } from './_test'
import rule, { RULE_NAME } from './vue-require-composable-prefix'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Already prefixed with use
    $`
      import { ref } from 'vue'

      function useCounter() {
        const count = ref(0)
        return { count }
      }
    `,
    // No reactivity — not a composable
    $`
      function helper() {
        let count = 0
        return { count }
      }
    `,
    // defineStore callback with ref — excluded
    $`
      import { ref } from 'vue'

      const defineStore = (fn) => fn()
      function defineMyStore() {
        const count = ref(0)
        return { count }
      }
    `,
    // setup function — excluded
    $`
      import { ref } from 'vue'

      function setup() {
        const count = ref(0)
        return { count }
      }
    `,
    // Nested function inside composable — not top-level
    $`
      import { ref } from 'vue'

      function useCounter() {
        function inner() {
          const count = ref(0)
          return count
        }
        return inner()
      }
    `,
    // Non-Vue import of ref — no reactivity detected
    $`
      import { ref } from 'some-other-library'

      function getRef() {
        const value = ref(0)
        return { value }
      }
    `,
    // Anonymous arrow — no name to check
    $`
      import { ref } from 'vue'

      export default () => {
        const count = ref(0)
        return { count }
      }
    `,
    // defineComponent — excluded
    $`
      import { ref } from 'vue'

      function defineComponent() {
        const count = ref(0)
        return { count }
      }
    `,
  ],
  invalid: [
    // Function declaration calling ref
    {
      code: $`
        import { ref } from 'vue'

        function getUser() {
          const user = ref(null)
          return { user }
        }
      `,
      errors: [{
        messageId: 'requirePrefix',
      }],
    },
    // Function calling another composable (useFetch)
    {
      code: $`
        function fetchData() {
          const { data } = useFetch('/api/data')
          return { data }
        }
      `,
      errors: [{
        messageId: 'requirePrefix',
      }],
    },
    // Function with reactive()
    {
      code: $`
        import { reactive } from 'vue'

        function createCounter() {
          const state = reactive({ count: 0 })
          return { state }
        }
      `,
      errors: [{
        messageId: 'requirePrefix',
      }],
    },
    // Function with computed()
    {
      code: $`
        import { computed } from 'vue'

        function initState(value) {
          const doubled = computed(() => value.value * 2)
          return { doubled }
        }
      `,
      errors: [{
        messageId: 'requirePrefix',
      }],
    },
    // Exported function with auto-imported ref
    {
      code: $`
        export function getData() {
          const data = ref(null)
          return { data }
        }
      `,
      errors: [{
        messageId: 'requirePrefix',
      }],
    },
    // Arrow function with ref
    {
      code: $`
        import { ref } from 'vue'

        const loadUser = () => {
          const x = ref(0)
          return { x }
        }
      `,
      errors: [{
        messageId: 'requirePrefix',
      }],
    },
    // Expression-body arrow with reactivity
    {
      code: $`
        import { ref } from 'vue'

        const getValue = () => ref(0)
      `,
      errors: [{
        messageId: 'requirePrefix',
      }],
    },
  ],
})
