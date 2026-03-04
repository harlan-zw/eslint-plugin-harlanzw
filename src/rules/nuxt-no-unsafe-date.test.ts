import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './nuxt-no-unsafe-date'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Date.now() inside a named function
    $`
      function getTimestamp() {
        return Date.now()
      }
    `,
    // new Date() inside a named function
    $`
      function getCurrentDate() {
        return new Date()
      }
    `,
    // new Date() with args is deterministic — safe
    $`
      const d = new Date('2024-01-01')
    `,
    // new Date() with timestamp arg — safe
    $`
      const d = new Date(1704067200000)
    `,
    // Date.parse is deterministic — safe
    $`
      const ts = Date.parse('2024-01-01')
    `,
    // Date.now() inside defineEventHandler — server only, no hydration
    $`
      export default defineEventHandler(() => {
        return Date.now()
      })
    `,
  ],
  invalid: [
    // Top-level Date.now()
    {
      code: $`
        const ts = Date.now()
      `,
      errors: [{ messageId: 'noDateNow' }],
    },
    // Top-level new Date()
    {
      code: $`
        const now = new Date()
      `,
      errors: [{ messageId: 'noNewDate' }],
    },
    // Date() as function (without new)
    {
      code: $`
        const now = Date()
      `,
      errors: [{ messageId: 'noDateCall' }],
    },
    // new Date() inside defineComponent setup() — Options API
    {
      code: $`
        export default defineComponent({
          setup() {
            return { now: new Date() }
          }
        })
      `,
      errors: [{ messageId: 'noNewDate' }],
    },
  ],
})

runVue({
  name: `${RULE_NAME} (Vue SFC)`,
  rule,
  valid: [
    // Date.now() inside onMounted — safe
    {
      code: $`
        <script setup>
        import { onMounted, ref } from 'vue'
        const ts = ref(0)
        onMounted(() => {
          ts.value = Date.now()
        })
        </script>
        <template><div>{{ ts }}</div></template>
      `,
      filename: 'test.vue',
    },
    // new Date() inside onMounted — safe
    {
      code: $`
        <script setup>
        import { onMounted, ref } from 'vue'
        const now = ref(null)
        onMounted(() => {
          now.value = new Date()
        })
        </script>
        <template><div>{{ now }}</div></template>
      `,
      filename: 'test.vue',
    },
    // Ternary client guard — safe
    {
      code: $`
        <script setup>
        const ts = import.meta.client ? Date.now() : 0
        </script>
        <template><div>{{ ts }}</div></template>
      `,
      filename: 'test.vue',
    },
    // import.meta.client guard — safe
    {
      code: $`
        <script setup>
        import { ref } from 'vue'
        const ts = ref(0)
        if (import.meta.client) {
          ts.value = Date.now()
        }
        </script>
        <template><div>{{ ts }}</div></template>
      `,
      filename: 'test.vue',
    },
    // new Date() with args is deterministic — safe
    {
      code: $`
        <script setup>
        const d = new Date('2024-01-01')
        </script>
        <template><div>{{ d }}</div></template>
      `,
      filename: 'test.vue',
    },
    // Inside event handler — safe
    {
      code: $`
        <script setup>
        function logTime() {
          console.log(Date.now())
        }
        </script>
        <template><button @click="logTime">Log</button></template>
      `,
      filename: 'test.vue',
    },
    // Inside watch callback — safe
    {
      code: $`
        <script setup>
        import { ref, watch } from 'vue'
        const count = ref(0)
        watch(count, () => {
          console.log(new Date())
        })
        </script>
        <template><div>{{ count }}</div></template>
      `,
      filename: 'test.vue',
    },
  ],
  invalid: [
    // Top-level Date.now() in setup
    {
      code: $`
        <script setup>
        const ts = Date.now()
        </script>
        <template><div>{{ ts }}</div></template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noDateNow' }],
    },
    // Top-level new Date() in setup
    {
      code: $`
        <script setup>
        const now = new Date()
        </script>
        <template><div>{{ now }}</div></template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noNewDate' }],
    },
    // Date.now() passed to inline callback
    {
      code: $`
        <script setup>
        const items = [1, 2, 3].map(i => i + Date.now())
        </script>
        <template><div>{{ items }}</div></template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noDateNow' }],
    },
    // Ternary alternate branch is NOT safe
    {
      code: $`
        <script setup>
        const ts = import.meta.client ? 0 : Date.now()
        </script>
        <template><div>{{ ts }}</div></template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noDateNow' }],
    },
    // Date.now() directly in template expression
    {
      code: $`
        <script setup>
        </script>
        <template><div>{{ Date.now() }}</div></template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noDateNowTemplate' }],
    },
    // new Date() in template expression
    {
      code: $`
        <script setup>
        </script>
        <template><div>{{ new Date() }}</div></template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noNewDateTemplate' }],
    },
  ],
})
