import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './vue-no-nested-reactivity'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Simple ref usage
    $`
      import { ref } from 'vue'
      
      const count = ref(0)
    `,
    // Simple reactive usage
    $`
      import { reactive } from 'vue'
      
      const state = reactive({ count: 0 })
    `,
    // Reactive with non-reactive values
    $`
      import { reactive } from 'vue'
      
      const state = reactive({
        count: 0,
        name: 'test',
        items: []
      })
    `,
    // Ref with non-reactive object
    $`
      import { ref } from 'vue'
      
      const data = ref({
        count: 0,
        name: 'test'
      })
    `,
    // Multiple separate reactive calls
    $`
      import { ref, reactive } from 'vue'
      
      const count = ref(0)
      const state = reactive({ name: 'test' })
    `,
    // Using same reactive type is allowed
    $`
      import { ref } from 'vue'
      
      const count = ref(0)
      const items = ref([])
    `,
    // No Vue imports
    $`
      const state = {
        count: ref(0)
      }
    `,
  ],
  invalid: [
    // Direct nesting: reactive with ref
    {
      code: $`
        import { reactive, ref } from 'vue'
        
        const state = reactive({
          count: ref(0)
        })
      `,
      errors: [{
        messageId: 'noNestedInReactive',
      }],
    },
    // Direct nesting: ref with reactive
    {
      code: $`
        import { ref, reactive } from 'vue'
        
        const data = ref({
          state: reactive({ count: 0 })
        })
      `,
      errors: [{
        messageId: 'noNestedInRef',
      }],
    },
    // Variable reference: ref variable in reactive
    {
      code: $`
        import { ref, reactive } from 'vue'
        
        const count = ref(0)
        const state = reactive({
          count
        })
      `,
      errors: [{
        messageId: 'noNestedInReactive',
      }],
    },
    // Variable reference: reactive variable in ref
    {
      code: $`
        import { ref, reactive } from 'vue'
        
        const state = reactive({ count: 0 })
        const data = ref({
          state
        })
      `,
      errors: [{
        messageId: 'noNestedInRef',
      }],
    },
    // Variable reference with property syntax
    {
      code: $`
        import { ref, reactive } from 'vue'
        
        const count = ref(0)
        const state = reactive({
          counter: count
        })
      `,
      errors: [{
        messageId: 'noNestedInReactive',
      }],
    },
    // Direct variable passing
    {
      code: $`
        import { ref, reactive } from 'vue'
        
        const count = ref(0)
        const state = reactive(count)
      `,
      errors: [{
        messageId: 'noNestedInReactive',
      }],
    },
    // Multiple nested reactive calls
    {
      code: $`
        import { ref, reactive } from 'vue'
        
        const state = reactive({
          count: ref(0),
          name: ref('test')
        })
      `,
      errors: [
        { messageId: 'noNestedInReactive' },
        { messageId: 'noNestedInReactive' },
      ],
    },
    // ShallowRef with reactive
    {
      code: $`
        import { shallowRef, reactive } from 'vue'
        
        const data = shallowRef({
          state: reactive({ count: 0 })
        })
      `,
      errors: [{
        messageId: 'noNestedInShallowRef',
      }],
    },
    // ShallowReactive with ref
    {
      code: $`
        import { shallowReactive, ref } from 'vue'
        
        const state = shallowReactive({
          count: ref(0)
        })
      `,
      errors: [{
        messageId: 'noNestedInShallowReactive',
      }],
    },
    // Complex nesting scenario
    {
      code: $`
        import { ref, reactive } from 'vue'
        
        const count = ref(0)
        const name = ref('test')
        const state = reactive({
          count,
          name,
          nested: {
            value: ref(42)
          }
        })
      `,
      errors: [
        { messageId: 'noNestedInReactive' },
        { messageId: 'noNestedInReactive' },
        { messageId: 'noNestedInReactive' },
      ],
    },
    // Computed inside reactive
    {
      code: $`
        import { reactive, computed } from 'vue'
        
        const state = reactive({
          count: 0,
          doubled: computed(() => state.count * 2)
        })
      `,
      errors: [{
        messageId: 'noNestedInReactive',
      }],
    },
    // Computed inside ref
    {
      code: $`
        import { ref, computed } from 'vue'
        
        const data = ref({
          value: computed(() => 42)
        })
      `,
      errors: [{
        messageId: 'noNestedInRef',
      }],
    },
    // Watch inside reactive
    {
      code: $`
        import { reactive, watch } from 'vue'
        
        const state = reactive({
          watcher: watch(() => {}, () => {})
        })
      `,
      errors: [{
        messageId: 'noNestedInReactive',
      }],
    },
    // Mixed computed and ref nesting
    {
      code: $`
        import { reactive, computed, ref } from 'vue'
        
        const state = reactive({
          count: ref(0),
          doubled: computed(() => 42)
        })
      `,
      errors: [
        { messageId: 'noNestedInReactive' },
        { messageId: 'noNestedInReactive' },
      ],
    },
    // Fixture file test case
    {
      code: $`
        import { computed, reactive, ref, shallowRef } from 'vue'
        
        const shallow = shallowRef('foo')
        const computedValue = computed(() => 'hello world')
        const bar = ref('bar')
        const reactiveRefs = reactive({
          foo: ref('bar'),
          bar,
          computedValue,
          shallow,
        })
        const refsWithReactive = ref({
          baz: reactive({ qux: 'quux' }),
          computedValue,
          shallow,
        })
      `,
      errors: [
        { messageId: 'noNestedInReactive' }, // foo: ref('bar')
        { messageId: 'noNestedInReactive' }, // bar variable
        { messageId: 'noNestedInReactive' }, // computedValue variable
        { messageId: 'noNestedInReactive' }, // shallow variable
        { messageId: 'noNestedInRef' }, // baz: reactive()
        { messageId: 'noNestedInRef' }, // computedValue variable in ref
        { messageId: 'noNestedInRef' }, // shallow variable in ref
      ],
    },
    // Computed returning ref directly
    {
      code: $`
        import { computed, ref } from 'vue'
        
        const computedRef = computed(() => ref(0))
      `,
      errors: [{
        messageId: 'noNestedInComputed',
      }],
    },
    // Computed returning reactive directly
    {
      code: $`
        import { computed, reactive } from 'vue'
        
        const computedReactive = computed(() => reactive({ count: 0 }))
      `,
      errors: [{
        messageId: 'noNestedInComputed',
      }],
    },
    // Computed returning ref variable
    {
      code: $`
        import { computed, ref } from 'vue'
        
        const count = ref(0)
        const computedRef = computed(() => count)
      `,
      errors: [{
        messageId: 'noNestedInComputed',
      }],
    },
    // Computed with block body returning ref
    {
      code: $`
        import { computed, ref } from 'vue'
        
        const computedRef = computed(() => {
          return ref(0)
        })
      `,
      errors: [{
        messageId: 'noNestedInComputed',
      }],
    },
    // Computed returning object with ref properties
    {
      code: $`
        import { computed, ref } from 'vue'
        
        const computedObj = computed(() => ({
          count: ref(0),
          name: ref('test')
        }))
      `,
      errors: [
        { messageId: 'noNestedInComputed' },
        { messageId: 'noNestedInComputed' },
      ],
    },
    // Computed returning object with ref variables
    {
      code: $`
        import { computed, ref } from 'vue'
        
        const count = ref(0)
        const name = ref('test')
        const computedObj = computed(() => ({
          count,
          name
        }))
      `,
      errors: [
        { messageId: 'noNestedInComputed' },
        { messageId: 'noNestedInComputed' },
      ],
    },
    // Computed with mixed reactive calls (like fixture)
    {
      code: $`
        import { computed, reactive, ref } from 'vue'
        
        const computedWithReactive = computed(() => ({
          foo: reactive({ bar: 'baz' }),
          bar: ref('qux'),
        }))
      `,
      errors: [
        { messageId: 'noNestedInComputed' }, // reactive call
        { messageId: 'noNestedInComputed' }, // ref call
      ],
    },
  ],
})

// Vue SFC tests
runVue({
  name: `${RULE_NAME} (Vue SFC)`,
  rule,
  valid: [
    // Vue SFC - correct reactivity usage
    {
      code: $`
        <script setup>
        import { ref, reactive, computed } from 'vue'
        
        // Correct usage - no nesting
        const count = ref(0)
        const user = reactive({ name: 'John', age: 30 })
        
        const doubled = computed(() => count.value * 2)
        
        function increment() {
          count.value++
        }
        </script>
        
        <template>
          <div>
            <p>Count: {{ count }}</p>
            <p>Doubled: {{ doubled }}</p>
            <p>User: {{ user.name }}</p>
            <button @click="increment">Increment</button>
          </div>
        </template>
      `,
      filename: 'test.vue',
    },
    // Vue SFC - separate reactive declarations
    {
      code: $`
        <script setup>
        import { ref, reactive } from 'vue'
        
        const isLoading = ref(false)
        const userState = reactive({
          name: '',
          email: ''
        })
        </script>
        
        <template>
          <div v-if="!isLoading">
            <input v-model="userState.name">
            <input v-model="userState.email">
          </div>
        </template>
      `,
      filename: 'test.vue',
    },
  ],
  invalid: [
    // Vue SFC - nested ref in reactive
    {
      code: $`
        <script setup>
        import { ref, reactive } from 'vue'
        
        // Incorrect - nesting ref inside reactive
        const state = reactive({
          count: ref(0),
          message: ref('Hello')
        })
        
        function increment() {
          state.count.value++
        }
        </script>
        
        <template>
          <div>
            <p>{{ state.count }}</p>
            <p>{{ state.message }}</p>
            <button @click="increment">Increment</button>
          </div>
        </template>
      `,
      filename: 'test.vue',
      errors: [
        { messageId: 'noNestedInReactive' },
        { messageId: 'noNestedInReactive' },
      ],
    },
    // Vue SFC - complex nested in computed
    {
      code: $`
        <script setup>
        import { ref, reactive, computed } from 'vue'
        
        const baseCount = ref(0)
        
        // Incorrect - nesting reactive/ref in computed
        const complexState = computed(() => reactive({
          doubled: ref(baseCount.value * 2),
          tripled: baseCount.value * 3
        }))
        </script>
        
        <template>
          <div>
            <p>Complex: {{ complexState.doubled }}</p>
            <p>Tripled: {{ complexState.tripled }}</p>
          </div>
        </template>
      `,
      filename: 'test.vue',
      errors: [
        { messageId: 'noNestedInComputed' },
        { messageId: 'noNestedInReactive' },
      ],
    },
  ],
})
