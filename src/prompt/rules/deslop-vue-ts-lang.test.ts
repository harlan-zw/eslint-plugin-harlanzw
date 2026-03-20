import { createPromptRuleTester } from '../_test'
import rule from './deslop-vue-ts-lang'

const ruleTester = createPromptRuleTester()

ruleTester.run('harlanzw/ai-deslop-vue-ts-lang', rule, {
  valid: [
    // Already has lang="ts"
    '```vue\n<script setup lang="ts">\nconst x = 1\n</script>\n```',
    // Single quotes
    '```vue\n<script setup lang=\'ts\'>\nconst x = 1\n</script>\n```',
    // Non-vue code block
    '```js\n<script setup>\nconst x = 1\n</script>\n```',
    // No code blocks
    'Just regular content.',
    // Script tag outside code block (prose)
    '<script setup>',
  ],
  invalid: [
    {
      // Basic script setup without lang
      code: '```vue\n<script setup>\nconst x = 1\n</script>\n```',
      errors: [{ messageId: 'missingLangTs' }],
      output: '```vue\n<script setup lang="ts">\nconst x = 1\n</script>\n```',
    },
    {
      // Plain script without lang
      code: '```vue\n<script>\nexport default {}\n</script>\n```',
      errors: [{ messageId: 'missingLangTs' }],
      output: '```vue\n<script lang="ts">\nexport default {}\n</script>\n```',
    },
    {
      // Multiple script blocks
      code: '```vue\n<script setup>\nconst x = 1\n</script>\n```\n\n```vue\n<script>\nexport default {}\n</script>\n```',
      errors: [{ messageId: 'missingLangTs' }, { messageId: 'missingLangTs' }],
      output: '```vue\n<script setup lang="ts">\nconst x = 1\n</script>\n```\n\n```vue\n<script lang="ts">\nexport default {}\n</script>\n```',
    },
  ],
})
