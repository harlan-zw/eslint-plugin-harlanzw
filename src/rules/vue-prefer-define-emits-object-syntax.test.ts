import { unindent as $ } from '@antfu/utils'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './vue-prefer-define-emits-object-syntax'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Object syntax (Vue 3.3+)
    $`
      const emit = defineEmits<{
        click: []
        change: [payload: string]
      }>()
    `,
    // Runtime declaration
    `const emit = defineEmits(['click', 'change'])`,
    // No type parameter
    `const emit = defineEmits()`,
    // Empty object type
    $`
      const emit = defineEmits<{}>()
    `,
  ],
  invalid: [
    // Single call signature
    {
      code: $`
        const emit = defineEmits<{
          (event: 'click'): void
        }>()
      `,
      output: $`
        const emit = defineEmits<{
          click: []
        }>()
      `,
      errors: [{ messageId: 'preferObjectSyntax' }],
    },
    // Multiple call signatures
    {
      code: $`
        const emit = defineEmits<{
          (event: 'click'): void
          (event: 'change', payload: string): void
        }>()
      `,
      output: $`
        const emit = defineEmits<{
          click: []
          change: [payload: string]
        }>()
      `,
      errors: [{ messageId: 'preferObjectSyntax' }],
    },
    // Mixed (call signature alongside property - still flags)
    {
      code: $`
        const emit = defineEmits<{
          (event: 'click'): void
          change: [payload: string]
        }>()
      `,
      output: $`
        const emit = defineEmits<{
          click: []
          change: [payload: string]
        }>()
      `,
      errors: [{ messageId: 'preferObjectSyntax' }],
    },
  ],
})

runVue({
  name: `${RULE_NAME} (Vue SFC)`,
  rule,
  valid: [
    {
      filename: 'test.vue',
      code: $`
        <script setup lang="ts">
        const emit = defineEmits<{
          click: []
          change: [payload: string]
        }>()
        </script>
      `,
    },
  ],
  invalid: [
    {
      filename: 'test.vue',
      code: $`
        <script setup lang="ts">
        const emit = defineEmits<{
          (event: 'click'): void
          (event: 'change', payload: string): void
        }>()
        </script>
      `,
      output: $`
        <script setup lang="ts">
        const emit = defineEmits<{
          click: []
          change: [payload: string]
        }>()
        </script>
      `,
      errors: [{ messageId: 'preferObjectSyntax' }],
    },
  ],
})
