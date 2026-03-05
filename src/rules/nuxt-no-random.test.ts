import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './nuxt-no-random'

run({
  name: `${RULE_NAME} (non-Vue files)`,
  rule,
  valid: [
    // Non-Vue files are always valid — rule only applies to .vue files
    $`
      const x = Math.random()
    `,
    $`
      const id = crypto.randomUUID()
    `,
    $`
      function shuffle(arr) {
        return arr.sort(() => Math.random() - 0.5)
      }
    `,
  ],
  invalid: [],
})

runVue({
  name: `${RULE_NAME} (Vue SFC)`,
  rule,
  valid: [
    // Math.random() inside onMounted — safe
    {
      code: $`
        <script setup>
        import { onMounted, ref } from 'vue'
        const order = ref(0)
        onMounted(() => {
          order.value = Math.random()
        })
        </script>
        <template><div>{{ order }}</div></template>
      `,
      filename: 'test.vue',
    },
    // Math.random() inside onBeforeMount — safe
    {
      code: $`
        <script setup>
        import { onBeforeMount, ref } from 'vue'
        const val = ref(0)
        onBeforeMount(() => {
          val.value = Math.random()
        })
        </script>
        <template><div>{{ val }}</div></template>
      `,
      filename: 'test.vue',
    },
    // Math.random() inside import.meta.client guard — safe
    {
      code: $`
        <script setup>
        import { ref } from 'vue'
        const order = ref(0)
        if (import.meta.client) {
          order.value = Math.random()
        }
        </script>
        <template><div>{{ order }}</div></template>
      `,
      filename: 'test.vue',
    },
    // Math.random() inside process.client guard — safe
    {
      code: $`
        <script setup>
        import { ref } from 'vue'
        const order = ref(0)
        if (process.client) {
          order.value = Math.random()
        }
        </script>
        <template><div>{{ order }}</div></template>
      `,
      filename: 'test.vue',
    },
    // Math.random() inside typeof window guard — safe
    {
      code: $`
        <script setup>
        import { ref } from 'vue'
        const order = ref(0)
        if (typeof window !== 'undefined') {
          order.value = Math.random()
        }
        </script>
        <template><div>{{ order }}</div></template>
      `,
      filename: 'test.vue',
    },
    // Ternary client guard — safe
    {
      code: $`
        <script setup>
        const x = import.meta.client ? Math.random() : 0
        </script>
        <template><div>{{ x }}</div></template>
      `,
      filename: 'test.vue',
    },
    // Math.random() inside a named function (event handler) — safe
    {
      code: $`
        <script setup>
        function handleClick() {
          console.log(Math.random())
        }
        </script>
        <template><button @click="handleClick">Go</button></template>
      `,
      filename: 'test.vue',
    },
    // Math.random() in watch callback (deferred) — safe
    {
      code: $`
        <script setup>
        import { ref, watch } from 'vue'
        const count = ref(0)
        watch(count, () => {
          console.log(Math.random())
        })
        </script>
        <template><div>{{ count }}</div></template>
      `,
      filename: 'test.vue',
    },
    // Not Math.random
    {
      code: $`
        <script setup>
        const x = Math.floor(42)
        </script>
        <template><div>{{ x }}</div></template>
      `,
      filename: 'test.vue',
    },
  ],
  invalid: [
    // Top-level Math.random() in script setup — hydration mismatch
    {
      code: $`
        <script setup>
        const x = Math.random()
        </script>
        <template><div>{{ x }}</div></template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noMathRandom' }],
    },
    // Math.random() used in sort at top level — the original bug
    {
      code: $`
        <script setup>
        import { ref } from 'vue'
        const items = ref([1, 2, 3])
        items.value.sort(() => Math.random() - 0.5)
        </script>
        <template><div v-for="i in items" :key="i">{{ i }}</div></template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noMathRandom' }],
    },
    // Math.random() in ternary at top level
    {
      code: $`
        <script setup>
        const coin = Math.random() > 0.5 ? 'heads' : 'tails'
        </script>
        <template><div>{{ coin }}</div></template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noMathRandom' }],
    },
    // crypto.randomUUID() in setup
    {
      code: $`
        <script setup>
        const id = crypto.randomUUID()
        </script>
        <template><div>{{ id }}</div></template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noCryptoRandom' }],
    },
    // Math.random() in watch getter (1st arg) — executes during setup
    {
      code: $`
        <script setup>
        import { watch } from 'vue'
        watch(() => Math.random(), (val) => {
          console.log(val)
        })
        </script>
        <template><div /></template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noMathRandom' }],
    },
    // Ternary — alternate branch is NOT safe
    {
      code: $`
        <script setup>
        const x = import.meta.client ? 0 : Math.random()
        </script>
        <template><div>{{ x }}</div></template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noMathRandom' }],
    },
    // Math.random() directly in template expression
    {
      code: $`
        <script setup>
        </script>
        <template><div>{{ Math.random() }}</div></template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noMathRandomTemplate' }],
    },
    // Math.random() in template v-bind
    {
      code: $`
        <script setup>
        </script>
        <template><div :style="{ opacity: Math.random() }">hi</div></template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noMathRandomTemplate' }],
    },
    // Math.random() in else branch of client guard — NOT safe (server branch)
    {
      code: $`
        <script setup>
        import { ref } from 'vue'
        const x = ref(0)
        if (import.meta.client) {
          x.value = 1
        } else {
          x.value = Math.random()
        }
        </script>
        <template><div>{{ x }}</div></template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noMathRandom' }],
    },
  ],
})
