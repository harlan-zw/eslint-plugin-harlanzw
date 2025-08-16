import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run } from './_test'
import rule, { RULE_NAME } from './vue-no-torefs-on-props'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Direct destructuring of props (allowed)
    $`
      const props = defineProps<{
        dateRange: DateRange
      }>()
      
      const { dateRange } = props
    `,
    // toRefs on non-props variable (allowed)
    $`
      import { toRefs } from 'vue'
      
      const state = reactive({ count: 0 })
      const { count } = toRefs(state)
    `,
    // toRefs with different variable name (allowed)
    $`
      import { toRefs } from 'vue'
      
      const data = { count: 0 }
      const { count } = toRefs(data)
    `,
  ],
  invalid: [
    // Using toRefs on props (not allowed)
    {
      code: $`
        import { toRefs } from 'vue'
        
        const props = defineProps<{
          dateRange: DateRange
        }>()
        
        const { dateRange } = toRefs(props)
      `,
      errors: [{ messageId: 'noToRefsOnProps' }],
    },
    // Using toRefs on props with different variable names
    {
      code: $`
        import { toRefs } from 'vue'
        
        const componentProps = defineProps<{
          value: string
        }>()
        
        const { value } = toRefs(componentProps)
      `,
      errors: [{ messageId: 'noToRefsOnProps' }],
    },
  ],
})
