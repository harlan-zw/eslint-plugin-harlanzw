import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run } from './_test'
import rule, { RULE_NAME } from './vue-require-composable-prefix'

const filename = 'composables/test.ts'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Already prefixed with use
    {
      code: $`
        import { ref } from 'vue'

        function useCounter() {
          const count = ref(0)
          return { count }
        }
      `,
      filename,
    },
    // No reactivity — not a composable
    {
      code: $`
        function helper() {
          let count = 0
          return { count }
        }
      `,
      filename,
    },
    // defineStore callback with ref — excluded
    {
      code: $`
        import { ref } from 'vue'

        const defineStore = (fn) => fn()
        function defineMyStore() {
          const count = ref(0)
          return { count }
        }
      `,
      filename,
    },
    // setup function — excluded
    {
      code: $`
        import { ref } from 'vue'

        function setup() {
          const count = ref(0)
          return { count }
        }
      `,
      filename,
    },
    // Nested function inside composable — not top-level
    {
      code: $`
        import { ref } from 'vue'

        function useCounter() {
          function inner() {
            const count = ref(0)
            return count
          }
          return inner()
        }
      `,
      filename,
    },
    // Non-Vue import of ref — no reactivity detected
    {
      code: $`
        import { ref } from 'some-other-library'

        function getRef() {
          const value = ref(0)
          return { value }
        }
      `,
      filename,
    },
    // Anonymous arrow — no name to check
    {
      code: $`
        import { ref } from 'vue'

        export default () => {
          const count = ref(0)
          return { count }
        }
      `,
      filename,
    },
    // defineComponent — excluded
    {
      code: $`
        import { ref } from 'vue'

        function defineComponent() {
          const count = ref(0)
          return { count }
        }
      `,
      filename,
    },
  ],
  invalid: [
    // Function declaration calling ref
    {
      filename,
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
      filename,
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
      filename,
      code: $`
        import { reactive } from 'vue'

        function makeCounter() {
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
      filename,
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
      filename,
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
      filename,
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
      filename,
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
