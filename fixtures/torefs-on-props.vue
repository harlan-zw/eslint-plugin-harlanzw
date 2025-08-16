<script lang="ts" setup>
import { toRef, toRefs } from 'vue'

const props = defineProps<{
  foo: string
  bar: string
}>()

const { foo, bar } = toRefs(props)


console.log(foo, bar)

// This should NOT trigger the rule - using toRefs on a different object
const otherData = { name: 'test', value: 123 }
const { name, value } = toRefs(otherData)

// This should NOT trigger the rule - using toRef (not toRefs)
const titleRef = toRef(props, 'title')

// This should NOT trigger the rule - direct destructuring
const { user } = props
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <p>Count: {{ count }}</p>
    <p>Name: {{ name }}</p>
    <p>Value: {{ value }}</p>
    <p>User: {{ user }}</p>
  </div>
</template>
