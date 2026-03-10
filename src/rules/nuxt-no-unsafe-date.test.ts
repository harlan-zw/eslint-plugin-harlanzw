import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './nuxt-no-unsafe-date'

run({
  name: `${RULE_NAME} (non-Vue files)`,
  rule,
  valid: [
    // Non-Vue files are always valid — rule only applies to .vue files
    $`
      const ts = Date.now()
    `,
    $`
      const now = new Date()
    `,
    $`
      function getTimestamp() {
        return Date.now()
      }
    `,
  ],
  invalid: [],
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
    // new Date().getFullYear() in template — safe (year is stable)
    {
      code: $`
        <script setup>
        </script>
        <template><div>© {{ new Date().getFullYear() }}</div></template>
      `,
      filename: 'test.vue',
    },
    // new Date().getFullYear() in setup — safe
    {
      code: $`
        <script setup>
        const year = new Date().getFullYear()
        </script>
        <template><div>{{ year }}</div></template>
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
