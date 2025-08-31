import { run } from './_test'
import rule from './vue-no-reactive-destructuring'

run({
  name: 'vue-no-reactive-destructuring',
  rule,
  valid: [
    // Valid: No destructuring
    'const state = reactive({ count: 0 })',

    // Valid: Direct property access
    'const state = reactive({ count: 0 }); console.log(state.count)',

    // Valid: Using toRefs
    'const { count } = toRefs(reactive({ count: 0 }))',

    // Valid: Not a reactive call
    'const { count } = someObject',

    // Valid: Different function call
    'const { count } = ref({ count: 0 })',

    // Valid: No destructuring with other patterns
    'const state = reactive({ count: 0 }); const count = state.count',
  ],
  invalid: [
    // Invalid: Object destructuring of reactive
    {
      code: 'const { count, name } = reactive({ count: 0, name: "test" })',
      errors: [{
        messageId: 'destructuringReactive',
        line: 1,
        column: 7,
      }],
      output: 'const { count, name } = toRefs(reactive({ count: 0, name: "test" }))',
    },

    // Invalid: Array destructuring of reactive
    {
      code: 'const [first, second] = reactive([1, 2])',
      errors: [{
        messageId: 'destructuringReactive',
        line: 1,
        column: 7,
      }],
      output: 'const [first, second] = toRefs(reactive([1, 2]))',
    },

    // Invalid: Nested destructuring
    {
      code: 'const { user: { name } } = reactive({ user: { name: "John" } })',
      errors: [{
        messageId: 'destructuringReactive',
        line: 1,
        column: 7,
      }],
      output: 'const { user: { name } } = toRefs(reactive({ user: { name: "John" } }))',
    },

    // Invalid: With default values
    {
      code: 'const { count = 0, name = "default" } = reactive({ count: 5 })',
      errors: [{
        messageId: 'destructuringReactive',
        line: 1,
        column: 7,
      }],
      output: 'const { count = 0, name = "default" } = toRefs(reactive({ count: 5 }))',
    },
  ],
})
