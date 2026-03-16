import { run, runVue } from './_test'
import rule, { RULE_NAME } from './vue-no-resolve-component-in-composables'

run({
  name: RULE_NAME,
  rule,
  valid: [
    {
      code: `import ProPositionMetric from './ProPositionMetric.vue'`,
      filename: 'composable.ts',
    },
    {
      code: `const result = someFunction('MyComponent')`,
      filename: 'composable.ts',
    },
  ],
  invalid: [
    {
      code: `import { resolveComponent } from 'vue'\nconst Comp = resolveComponent('ProPositionMetric')`,
      filename: 'composable.ts',
      errors: [{ messageId: 'noResolveInComposable' }],
    },
    {
      code: `import { resolveComponent } from 'vue'\nexport function createColumns() {\n  const UBadge = resolveComponent('UBadge')\n  return UBadge\n}`,
      filename: 'composable.ts',
      errors: [{ messageId: 'noResolveInComposable' }],
    },
    {
      code: `import { resolveDirective } from 'vue'\nconst dir = resolveDirective('tooltip')`,
      filename: 'composable.ts',
      errors: [{ messageId: 'noResolveInComposable' }],
    },
  ],
})

runVue({
  name: `${RULE_NAME} (Vue SFC)`,
  rule,
  valid: [
    {
      code: `
        <script setup>
        import { resolveComponent } from 'vue'
        const Comp = resolveComponent('MyComponent')
        </script>
        <template><div /></template>
      `,
      filename: 'test.vue',
    },
  ],
  invalid: [
    {
      code: `
        <script setup>
        import { resolveComponent } from 'vue'
        function buildColumns() {
          const Comp = resolveComponent('MyComponent')
          return Comp
        }
        </script>
        <template><div /></template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noResolveInNestedScope' }],
    },
    {
      code: `
        <script setup>
        import { resolveComponent } from 'vue'
        const columns = computed(() => {
          const Badge = resolveComponent('UBadge')
          return Badge
        })
        </script>
        <template><div /></template>
      `,
      filename: 'test.vue',
      errors: [{ messageId: 'noResolveInNestedScope' }],
    },
  ],
})
