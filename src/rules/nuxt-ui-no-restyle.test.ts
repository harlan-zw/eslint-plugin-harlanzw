/* eslint-disable no-template-curly-in-string -- Fixtures contain Vue template expressions. */
import { runVue } from './_test'
import rule from './nuxt-ui-no-restyle'

runVue({
  name: 'nuxt-ui-no-restyle',
  rule,
  valid: [
    { code: '<template><UCheckbox class="[&_button]:size-11 sm:[&_button]:size-4" /></template>', options: [{ components: { UCheckbox: { allow: ['[&_button]:size-11', 'sm:[&_button]:size-4'] } } }] },
    { code: '<template><UiCard class="focus-visible:ring-2 focus-visible:ring-primary" /></template>', options: [{ components: { UiCard: { allow: ['focus-visible:ring-*'] } } }] },
    { code: '<template><UInput :ui="{ base: \'focus-visible:ring-2\' }" /></template>', options: [{ components: { UInput: { slots: { base: ['focus-visible:ring-*'] } } } }] },
    '<script setup>import { Button } from "#components"</script><template><Button class="p-4" /></template>',

    '<script setup>const classes = "p-4"</script><template><UButton v-for="classes in items" :class="classes" /></template>',
    '<script setup>const classes = "p-4"</script><template><Wrapper v-slot="{ classes }"><UButton :class="classes" /></Wrapper></template>',
    '<template><UButton :class="`mt-4 ${classes}`" /></template>',
    '<template><UButton :class="`mt-4`" /></template>',
    '<template><UButton :class="{ \'w-full\': size === \'p-4\' }" /></template>',

    '<template><UButton size="lg" class="mt-4 md:w-full" /></template>',
    '<template><u-badge :class="[active && \'ml-2\', { \'w-full\': wide }]" /></template>',
    '<template><div class="p-4" /><OtherButton class="p-4" /></template>',
    '<script setup>import UButton from "other-library"</script><template><UButton class="p-4" /></template>',
    { code: '<template><UButton class="p-4" :ui="{ label: \'truncate\' }" /></template>', options: [{ components: { UButton: { allow: ['p-*'], slots: { label: ['truncate'] } } } }] },
    { code: '<template><UButton class="p-4" /></template>', options: [{ components: { UButton: false } }] },
  ].map(value => typeof value === 'string' ? { code: value, filename: 'test.vue' } : { ...value, filename: 'test.vue' }),
  invalid: [
    { code: '<template><UiCard class="ring-2 hover:ring-2 focus-visible:ring-2 bg-red-500" /></template>', options: [{ components: { UiCard: { allow: ['focus-visible:ring-*'] } } }], errors: 3 },
    { code: '<template><UCheckbox class="size-11 [&_button]:size-11 sm:[&_button]:size-11" /></template>', options: [{ components: { UCheckbox: { allow: ['[&_button]:size-11'] } } }], errors: 2 },
    { code: '<script setup>import UButton from "./UButton.vue"; import Action from "@nuxt/ui/components/Button.vue"</script><template><UButton class="p-4" /><Action class="p-4" /></template>', errors: 1 },

    { code: '<script setup lang="ts">import type { UButton } from "types"</script><template><UButton class="p-4" /></template>', errors: 1 },

    { code: '<script setup>const classes = "p-4"</script><template><UButton :class="classes" /></template>', errors: 1 },
    { code: '<script setup>const ui = { base: "p-4" }</script><template><UButton :ui="ui" /></template>', errors: 1 },
    { code: '<script setup>import { UButton as Action } from "#components"</script><template><Action class="p-4" /></template>', errors: 1 },
    { code: '<script setup>import Button from "@nuxt/ui/components/Button.vue"</script><template><Button class="p-4" /></template>', errors: 1 },
    { code: '<script setup>import BrandButton from "./BrandButton.vue"</script><template><BrandButton class="p-4" /></template>', options: [{ components: { BrandButton: {} } }], errors: 1 },

    { code: '<template><UButton class="p-4 hover:rounded-full" /></template>', errors: [{ messageId: 'restyle' }, { messageId: 'restyle' }] },
    { code: '<template><u-button :ui="{ base: \'md:p-4\', label: active ? \'font-bold\' : \'font-normal\' }" /></template>', errors: 3 },
    { code: '<template><UButton :class="{ \'p-4\': active }" /></template>', errors: 1 },
    { code: '<template><UButton class="[&:hover]:!p-4 p-2!" /></template>', errors: 2 },
    { code: '<template><UButton :class="active ? \'bg-red-500\' : \'bg-primary\'" /></template>', errors: 2 },
    { code: '<template><UButton class="p-4" /></template>', options: [{ source: 'app/app.config.ts', components: { UButton: { sizes: ['compact', 'roomy'] } } }], errors: [{ messageId: 'restyle', data: { className: 'p-4', component: 'UButton', guidance: 'Use the size prop: compact, roomy. See app/app.config.ts for shared styling.' } }] },
    { code: '<template><BrandButton class="p-4" /></template>', options: [{ components: { BrandButton: { message: 'Use the approved density prop.' } } }], errors: [{ messageId: 'restyle', data: { className: 'p-4', component: 'BrandButton', guidance: 'Use the approved density prop.' } }] },
  ].map(value => ({ ...value, filename: 'test.vue' })),
})
