import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './vue-no-ref-access-in-templates'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Direct ref usage in script (allowed)
    $`
      import { ref } from 'vue'
      
      const count = ref(0)
      console.log(count.value)
    `,
    // Ref usage in regular template literal (allowed)
    $`
      import { ref } from 'vue'
      
      const message = ref('Hello')
      const template = \`<div>\${message}</div>\`
    `,
    // Non-ref variable access in template (allowed)
    $`
      const data = { value: 'test' }
      const template = html\`<div>\${data.value}</div>\`
    `,
  ],
  invalid: [
    // Using ref.value in html template literal (not allowed)
    {
      code: $`
        import { ref } from 'vue'
        
        const count = ref(0)
        const template = html\`<div>\${count.value}</div>\`
      `,
      errors: [{ messageId: 'noRefAccessInTemplate' }],
    },
    // Using ref.value in html template with complex expression (not allowed)
    {
      code: $`
        import { ref } from 'vue'
        
        const inputValue = ref('')
        const template = html\`<input value="\${inputValue.value}" />\`
      `,
      errors: [{ messageId: 'noRefAccessInTemplate' }],
    },
    // Multiple ref.value usages in same template (not allowed)
    {
      code: $`
        import { ref } from 'vue'
        
        const isVisible = ref(false)
        const template = html\`<button onclick="\${() => isVisible.value = !isVisible.value}">Toggle</button>\`
      `,
      errors: [
        { messageId: 'noRefAccessInTemplate' },
        { messageId: 'noRefAccessInTemplate' },
      ],
    },
  ],
})

// Vue SFC tests
runVue({
  name: `${RULE_NAME} (Vue SFC)`,
  rule,
  valid: [
    // Vue SFC - correct ref usage (no .value in template)
    {
      code: $`
        <script setup>
        import { ref } from 'vue'
        
        const count = ref(0)
        const message = ref('Hello')
        
        // Using .value in script is fine
        console.log(count.value)
        
        function increment() {
          count.value++
        }
        </script>
        
        <template>
          <div>
            <p>{{ count }}</p>
            <p>{{ message }}</p>
            <button @click="increment">Increment</button>
          </div>
        </template>
      `,
      filename: 'test.vue',
    },
    // Vue SFC - non-ref variables with .value
    {
      code: $`
        <script setup>
        const data = { value: 'test' }
        const options = { value: 42 }
        </script>
        
        <template>
          <div>
            <p>{{ data.value }}</p>
            <p>{{ options.value }}</p>
          </div>
        </template>
      `,
      filename: 'test.vue',
    },
  ],
  invalid: [
    // Vue SFC - using .value on refs in template
    {
      code: $`
        <script setup>
        import { ref } from 'vue'
        
        const count = ref(0)
        const message = ref('Hello')
        
        function increment() {
          count.value++
        }
        </script>
        
        <template>
          <div>
            <p>{{ count.value }}</p>
            <p>{{ message.value }}</p>
            <button @click="increment">Increment</button>
          </div>
        </template>
      `,
      filename: 'test.vue',
      errors: [
        { messageId: 'noRefAccessInTemplate' },
        { messageId: 'noRefAccessInTemplate' },
      ],
    },
    // Vue SFC - complex ref usage in template
    {
      code: $`
        <script setup>
        import { ref, computed } from 'vue'
        
        const user = ref({ name: 'John', age: 30 })
        const isVisible = ref(false)
        
        const displayName = computed(() => user.value.name.toUpperCase())
        </script>
        
        <template>
          <div>
            <h1 v-if="isVisible.value">{{ user.value.name }}</h1>
            <p>Age: {{ user.value.age }}</p>
            <p>Display: {{ displayName }}</p>
            <button @click="isVisible.value = !isVisible.value">
              Toggle
            </button>
          </div>
        </template>
      `,
      filename: 'test.vue',
      errors: [
        { messageId: 'noRefAccessInTemplate' },
        { messageId: 'noRefAccessInTemplate' },
        { messageId: 'noRefAccessInTemplate' },
        { messageId: 'noRefAccessInTemplate' },
        { messageId: 'noRefAccessInTemplate' },
      ],
    },
  ],
})
