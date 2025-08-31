import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run, runVue } from './_test'
import rule, { RULE_NAME } from './nuxt-no-redundant-import-meta'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Non-scoped files should not trigger
    {
      code: $`
        if (import.meta.server) {
          console.log('server side')
        }
      `,
      filename: 'components/MyComponent.vue',
    },
    {
      code: $`
        if (import.meta.client) {
          console.log('client side')
        }
      `,
      filename: 'components/MyComponent.js',
    },
    // Cross-checks should be valid (server component checking client, etc.)
    {
      code: $`
        if (import.meta.client) {
          console.log('client side code in server component')
        }
      `,
      filename: 'components/MyComponent.server.vue',
    },
    {
      code: $`
        if (import.meta.server) {
          console.log('server side code in client component')
        }
      `,
      filename: 'components/MyComponent.client.vue',
    },
    // Other import.meta properties should be fine
    {
      code: $`
        if (import.meta.env) {
          console.log('env')
        }
      `,
      filename: 'components/MyComponent.server.vue',
    },
    {
      code: $`
        const url = import.meta.url
      `,
      filename: 'components/MyComponent.client.vue',
    },
    // Non-import.meta expressions
    {
      code: $`
        if (process.server) {
          console.log('server side')
        }
      `,
      filename: 'components/MyComponent.server.vue',
    },
  ],
  invalid: [
    // Server component checking import.meta.server
    {
      code: $`
        if (import.meta.server) {
          console.log('server side')
        }
      `,
      filename: 'components/MyComponent.server.vue',
      errors: [{
        messageId: 'redundantImportMeta',
        data: { scope: 'server-only' },
      }],
    },
    // Client component checking import.meta.client
    {
      code: $`
        if (import.meta.client) {
          console.log('client side')
        }
      `,
      filename: 'components/MyComponent.client.vue',
      errors: [{
        messageId: 'redundantImportMeta',
        data: { scope: 'client-only' },
      }],
    },
    // Server TypeScript file checking import.meta.server
    {
      code: $`
        if (import.meta.server) {
          doServerStuff()
        }
      `,
      filename: 'utils/helper.server.ts',
      errors: [{
        messageId: 'redundantImportMeta',
        data: { scope: 'server-only' },
      }],
    },
    // Client JavaScript file checking import.meta.client
    {
      code: $`
        if (import.meta.client) {
          doClientStuff()
        }
      `,
      filename: 'utils/helper.client.js',
      errors: [{
        messageId: 'redundantImportMeta',
        data: { scope: 'client-only' },
      }],
    },
    // Multiple redundant checks in same file
    {
      code: $`
        if (import.meta.server) {
          console.log('first check')
        }
        
        function someFunction() {
          if (import.meta.server) {
            console.log('second check')
          }
        }
      `,
      filename: 'components/ServerComponent.server.vue',
      errors: [
        {
          messageId: 'redundantImportMeta',
          data: { scope: 'server-only' },
        },
        {
          messageId: 'redundantImportMeta',
          data: { scope: 'server-only' },
        },
      ],
    },
    // Ternary expression with redundant check
    {
      code: $`
        const message = import.meta.client ? 'client' : 'other'
      `,
      filename: 'components/ClientComponent.client.vue',
      errors: [{
        messageId: 'redundantImportMeta',
        data: { scope: 'client-only' },
      }],
    },
    // Logical expressions with redundant check
    {
      code: $`
        const shouldRun = someCondition && import.meta.server
      `,
      filename: 'middleware/auth.server.ts',
      errors: [{
        messageId: 'redundantImportMeta',
        data: { scope: 'server-only' },
      }],
    },
    // Function call with redundant check
    {
      code: $`
        someFunction(import.meta.client)
      `,
      filename: 'composables/useFeature.client.js',
      errors: [{
        messageId: 'redundantImportMeta',
        data: { scope: 'client-only' },
      }],
    },
  ],
})

// Vue SFC tests
runVue({
  name: `${RULE_NAME} (Vue SFC)`,
  rule,
  valid: [
    // Non-scoped Vue component
    {
      code: $`
        <script setup>
        if (import.meta.server) {
          console.log('server side')
        }
        if (import.meta.client) {
          console.log('client side')
        }
        </script>
        
        <template>
          <div>Regular component</div>
        </template>
      `,
      filename: 'components/MyComponent.vue',
    },
    // Server component checking client (valid cross-check)
    {
      code: $`
        <script setup>
        if (import.meta.client) {
          console.log('This will run on client')
        }
        
        // Server-specific logic without redundant check
        console.log('This runs on server')
        </script>
        
        <template>
          <div>Server component</div>
        </template>
      `,
      filename: 'components/ServerComponent.server.vue',
    },
    // Client component checking server (valid cross-check)
    {
      code: $`
        <script setup>
        if (import.meta.server) {
          console.log('This will run on server during SSR')
        }
        
        // Client-specific logic without redundant check
        console.log('This runs on client')
        </script>
        
        <template>
          <div>Client component</div>
        </template>
      `,
      filename: 'components/ClientComponent.client.vue',
    },
  ],
  invalid: [
    // Server component with redundant server check
    {
      code: $`
        <script setup>
        if (import.meta.server) {
          console.log('This is redundant in .server.vue')
        }
        
        // Some server logic
        const data = await $fetch('/api/data')
        </script>
        
        <template>
          <div>{{ data }}</div>
        </template>
      `,
      filename: 'components/ServerComponent.server.vue',
      errors: [{
        messageId: 'redundantImportMeta',
        data: { scope: 'server-only' },
      }],
    },
    // Client component with redundant client check
    {
      code: $`
        <script setup>
        import { ref, onMounted } from 'vue'
        
        const element = ref(null)
        
        onMounted(() => {
          if (import.meta.client) {
            console.log('This is redundant in .client.vue')
            element.value.focus()
          }
        })
        </script>
        
        <template>
          <input ref="element" />
        </template>
      `,
      filename: 'components/ClientComponent.client.vue',
      errors: [{
        messageId: 'redundantImportMeta',
        data: { scope: 'client-only' },
      }],
    },
    // Composition API usage with redundant check
    {
      code: $`
        <script setup>
        import { computed } from 'vue'
        
        const message = computed(() => {
          return import.meta.server ? 'server message' : 'fallback'
        })
        </script>
        
        <template>
          <div>{{ message }}</div>
        </template>
      `,
      filename: 'components/Message.server.vue',
      errors: [{
        messageId: 'redundantImportMeta',
        data: { scope: 'server-only' },
      }],
    },
    // Multiple script blocks with redundant checks
    {
      code: $`
        <script>
        export default {
          name: 'ClientComponent'
        }
        </script>
        
        <script setup>
        if (import.meta.client) {
          console.log('redundant check in setup')
        }
        </script>
        
        <template>
          <div>Component</div>
        </template>
      `,
      filename: 'components/ClientComponent.client.vue',
      errors: [{
        messageId: 'redundantImportMeta',
        data: { scope: 'client-only' },
      }],
    },
  ],
})
