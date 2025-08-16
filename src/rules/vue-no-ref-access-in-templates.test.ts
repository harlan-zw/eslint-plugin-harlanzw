import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run } from './_test'
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
