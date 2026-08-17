import { unindent as $ } from 'eslint-vitest-rule-tester'
import { runVue } from './_test'
import rule, { RULE_NAME } from './nuxt-no-redundant-component-imports'

runVue({
  name: RULE_NAME,
  rule,
  valid: [
    {
      filename: 'Component.vue',
      code: $`
        <script setup lang="ts">
        import { UiButton } from '#components'

        const button = h(UiButton)
        </script>

        <template>
          <component :is="button" />
        </template>
      `,
    },
    {
      filename: 'Component.vue',
      code: $`
        <script setup lang="ts">
        import { UiSkeleton as SkeletonComponent } from '#components'
        </script>

        <template>
          <SkeletonComponent />
        </template>
      `,
    },
    {
      filename: 'Component.vue',
      code: $`
        <script setup lang="ts">
        import { UiButton } from '#components'
        </script>

        <template>
          <component :is="UiButton" />
        </template>
      `,
    },
    {
      filename: 'Component.vue',
      code: $`
        <script setup lang="ts">
        import type { UiButton } from '#components'

        type Button = typeof UiButton
        </script>
      `,
    },
    {
      filename: 'Component.vue',
      code: $`
        <script setup lang="ts">
        import { UiButton } from './components'
        </script>

        <template>
          <UiButton />
        </template>
      `,
    },
  ],
  invalid: [
    {
      filename: 'Component.vue',
      code: $`
        <script setup lang="ts">
        import { UiButton } from '#components'
        </script>

        <template>
          <UiButton />
        </template>
      `,
      output: $`
        <script setup lang="ts">
        </script>

        <template>
          <UiButton />
        </template>
      `,
      errors: [{ messageId: 'redundantComponentImports', data: { components: 'UiButton' } }],
    },
    {
      filename: 'Component.vue',
      code: $`
        <script setup lang="ts">
        import { NuxtLink, UiButton, UiCard } from '#components'

        const card = h(UiCard)
        </script>

        <template>
          <NuxtLink to="/">
            <ui-button>Home</ui-button>
          </NuxtLink>
          <component :is="card" />
        </template>
      `,
      output: $`
        <script setup lang="ts">
        import { UiCard } from '#components'

        const card = h(UiCard)
        </script>

        <template>
          <NuxtLink to="/">
            <ui-button>Home</ui-button>
          </NuxtLink>
          <component :is="card" />
        </template>
      `,
      errors: [{ messageId: 'redundantComponentImports', data: { components: 'NuxtLink, UiButton' } }],
    },
    {
      filename: 'Component.vue',
      code: $`
        <script setup lang="ts">
        import {
          NuxtLink,
          UiButton,
          UiCard,
          UiSkeleton as SkeletonComponent,
        } from '#components'

        const card = h(UiCard)
        </script>

        <template>
          <NuxtLink to="/" />
          <UiButton />
          <SkeletonComponent />
          <component :is="card" />
        </template>
      `,
      output: $`
        <script setup lang="ts">
        import {
          UiCard,
          UiSkeleton as SkeletonComponent,
        } from '#components'

        const card = h(UiCard)
        </script>

        <template>
          <NuxtLink to="/" />
          <UiButton />
          <SkeletonComponent />
          <component :is="card" />
        </template>
      `,
      errors: [{ messageId: 'redundantComponentImports', data: { components: 'NuxtLink, UiButton' } }],
    },
    {
      // a comment between specifiers would re-attach to the wrong import, so report only
      filename: 'Component.vue',
      code: $`
        <script setup lang="ts">
        import {
          // navigation
          NuxtLink,
          UiCard,
        } from '#components'

        const card = h(UiCard)
        </script>

        <template>
          <NuxtLink to="/" />
          <component :is="card" />
        </template>
      `,
      output: null,
      errors: [{ messageId: 'redundantComponentImports', data: { components: 'NuxtLink' } }],
    },
    {
      // the whole declaration goes, so its comments go with it
      filename: 'Component.vue',
      code: $`
        <script setup lang="ts">
        import {
          // navigation
          NuxtLink,
        } from '#components'
        </script>

        <template>
          <NuxtLink to="/" />
        </template>
      `,
      output: $`
        <script setup lang="ts">
        </script>

        <template>
          <NuxtLink to="/" />
        </template>
      `,
      errors: [{ messageId: 'redundantComponentImports', data: { components: 'NuxtLink' } }],
    },
  ],
})
