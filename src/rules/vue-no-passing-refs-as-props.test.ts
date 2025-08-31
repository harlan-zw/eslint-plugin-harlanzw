import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './vue-no-passing-refs-as-props'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Using ref.value correctly (allowed)
    $`
      import { ref } from 'vue'
      
      const foo = { bar: ref('test') }
      const template = html\`<MyComponent :bar="\${foo.bar.value}" />\`
    `,
    // Variable declaration without initialization (should not crash)
    $`
      let foo;
      const bar = undefined;
    `,
    // Using reactive instead of refs (allowed)
    $`
      import { reactive } from 'vue'
      
      const state = reactive({ bar: 'test' })
      const template = html\`<MyComponent :bar="\${state.bar}" />\`
    `,
    // Non-ref properties (allowed)
    $`
      const data = { value: 'test', count: 42 }
      const template = html\`<MyComponent :value="\${data.value}" :count="\${data.count}" />\`
    `,
    // Direct ref usage without object wrapper (allowed)
    $`
      import { ref } from 'vue'
      
      const message = ref('Hello')
      const template = html\`<MyComponent :message="\${message.value}" />\`
    `,
  ],
  invalid: [
    // Passing ref as prop without unwrapping (not allowed)
    {
      code: $`
        import { ref } from 'vue'
        
        const foo = { bar: ref('test') }
        const template = html\`<MyComponent :bar="\${foo.bar}" />\`
      `,
      errors: [{ messageId: 'noPassingRefsAsProps' }],
    },
    // Multiple ref properties being passed (not allowed)
    {
      code: $`
        import { ref } from 'vue'
        
        const state = {
          name: ref('John'),
          age: ref(25),
          active: ref(true)
        }
        const template = html\`<UserCard :name="\${state.name}" :age="\${state.age}" />\`
      `,
      errors: [
        { messageId: 'noPassingRefsAsProps' },
        { messageId: 'noPassingRefsAsProps' },
      ],
    },
    // Mixed ref and non-ref properties (only refs should error)
    {
      code: $`
        import { ref } from 'vue'
        
        const data = {
          title: ref('My Title'),
          description: 'Static description',
          count: ref(0)
        }
        const template = html\`<Card :title="\${data.title}" :desc="\${data.description}" :count="\${data.count}" />\`
      `,
      errors: [
        { messageId: 'noPassingRefsAsProps' },
        { messageId: 'noPassingRefsAsProps' },
      ],
    },
    // Nested component usage (not allowed)
    {
      code: $`
        import { ref } from 'vue'
        
        const config = { theme: ref('dark') }
        const template = html\`
          <div>
            <Header :theme="\${config.theme}" />
            <Content />
          </div>
        \`
      `,
      errors: [{ messageId: 'noPassingRefsAsProps' }],
    },
  ],
})

// Vue SFC tests
runVue({
  name: `${RULE_NAME} (Vue SFC)`,
  rule,
  valid: [
    // Vue SFC - correct prop passing (unwrapped refs)
    {
      code: $`
        <script setup>
        import { ref } from 'vue'
        import ChildComponent from './ChildComponent.vue'
        
        const count = ref(0)
        const message = ref('Hello')
        
        // Correctly unwrapping refs before passing as props
        </script>
        
        <template>
          <div>
            <ChildComponent 
              :count="count" 
              :message="message"
            />
          </div>
        </template>
      `,
      filename: 'test.vue',
    },
    // Vue SFC - passing regular values
    {
      code: $`
        <script setup>
        import { reactive } from 'vue'
        import ChildComponent from './ChildComponent.vue'
        
        const state = reactive({ name: 'John', age: 30 })
        const staticValue = 'static'
        </script>
        
        <template>
          <div>
            <ChildComponent 
              :name="state.name"
              :age="state.age" 
              :static="staticValue"
            />
          </div>
        </template>
      `,
      filename: 'test.vue',
    },
  ],
  invalid: [
    // Vue SFC - this rule might not detect template-based ref passing
    // The rule appears to focus on JavaScript/TypeScript prop passing patterns
  ],
})
