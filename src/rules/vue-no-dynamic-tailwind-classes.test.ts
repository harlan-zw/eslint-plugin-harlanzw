/* eslint-disable no-template-curly-in-string -- Fixtures contain Vue template expressions. */
import { runVue } from './_test'
import rule from './vue-no-dynamic-tailwind-classes'

runVue({
  name: 'vue-no-dynamic-tailwind-classes',
  rule,
  valid: [
    '<script setup>const classes = `p-${size}`</script><template><div v-for="classes in items" :class="classes" /></template>',
    '<script setup>let classes = "p-" + size</script><template><div :class="classes" /></template>',

    '<template><div :class="active ? \'bg-primary\' : \'bg-muted\'" /></template>',
    '<template><div :class="[classes, { \'p-4\': active }]" /></template>',
    '<template><div :class="`p-4 ${classes}`" /></template>',
    '<template><div :class="\'p-4 \' + classes" /></template>',
    '<template><div :title="`bg-${color}`" /></template>',
    '<template><div class="p-4" /></template>',
  ].map(code => ({ code, filename: 'test.vue' })),
  invalid: [
    '<template><div :class="`p-${4}`" /></template>',
    '<script setup>const size = "4"</script><template><div :class="`p-${size}`" /></template>',
    '<template><div :class="\'p-\' + \'4\'" /></template>',

    '<script setup>const classes = `p-${size}`</script><template><div :class="classes" /></template>',
    '<script setup>const first = `p-${size}`; const second = first</script><template><div :class="second" /></template>',
    '<script setup>const ui = { base: `p-${size}` }</script><template><UButton :ui="ui" /></template>',

    '<template><div :class="`bg-${color}-500`" /></template>',
    '<template><div :class="\'bg-\' + color" /></template>',
    '<template><div :class="{ [`p-${size}`]: active }" /></template>',
    '<template><UButton :ui="{ base: `p-${size}` }" /></template>',
    '<template><div :class="active && `md:${utility}`" /></template>',
  ].map(code => ({ code, filename: 'test.vue', errors: [{ messageId: 'partialClass' }] })),
})
