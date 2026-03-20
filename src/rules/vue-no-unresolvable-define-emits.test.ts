import { unindent as $ } from '@antfu/utils'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './vue-no-unresolvable-define-emits'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Literal string types
    $`
      const emit = defineEmits<{
        (event: 'click'): void
        (event: 'change', payload: string): void
      }>()
    `,
    // Union of literals
    $`
      const emit = defineEmits<{
        (event: 'click' | 'change'): void
      }>()
    `,
    // Object syntax (Vue 3.3+)
    $`
      const emit = defineEmits<{
        click: []
        change: [payload: string]
      }>()
    `,
    // No type parameter
    `const emit = defineEmits(['click', 'change'])`,
  ],
  invalid: [
    // typeof with indexed access
    {
      code: $`
        const events = ['click', 'change'] as const
        const emit = defineEmits<{
          (event: typeof events[number]): void
        }>()
      `,
      errors: [{ messageId: 'noUnresolvableDefineEmits' }],
    },
    // typeof alone
    {
      code: $`
        type Events = 'click' | 'change'
        const eventsObj = {} as { type: Events }
        const emit = defineEmits<{
          (event: typeof eventsObj['type']): void
        }>()
      `,
      errors: [{ messageId: 'noUnresolvableDefineEmits' }],
    },
    // Multiple call signatures with unresolvable types
    {
      code: $`
        const eventsA = ['a'] as const
        const eventsB = ['b'] as const
        const emit = defineEmits<{
          (event: typeof eventsA[number]): void
          (event: typeof eventsB[number], payload: MouseEvent): void
        }>()
      `,
      errors: [
        { messageId: 'noUnresolvableDefineEmits' },
        { messageId: 'noUnresolvableDefineEmits' },
      ],
    },
    // Conditional type
    {
      code: $`
        const emit = defineEmits<{
          (event: true extends false ? 'a' : 'b'): void
        }>()
      `,
      errors: [{ messageId: 'noUnresolvableDefineEmits' }],
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
          (event: 'click'): void
        }>()
        </script>
      `,
    },
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
        const events = ['click', 'change'] as const
        const emit = defineEmits<{
          (event: typeof events[number]): void
        }>()
        </script>
      `,
      errors: [{ messageId: 'noUnresolvableDefineEmits' }],
    },
    {
      filename: 'test.vue',
      code: $`
        <script setup lang="ts">
        const eventsWithoutPayload = ['click', 'hover'] as const
        const eventsWithMapMouseEventPayload = ['mapClick'] as const
        const emit = defineEmits<{
          (event: typeof eventsWithoutPayload[number]): void
          (event: typeof eventsWithMapMouseEventPayload[number], payload: google.maps.MapMouseEvent): void
        }>()
        </script>
      `,
      errors: [
        { messageId: 'noUnresolvableDefineEmits' },
        { messageId: 'noUnresolvableDefineEmits' },
      ],
    },
  ],
})
