<script lang="ts" setup>
import { ref } from 'vue'
import ChildComponent from './ChildComponent.vue'

const count = ref(0)
const data = {
  userRef: ref('user data'),
  normalValue: 'static',
}
</script>

<template>
  <div>
    <!-- This should trigger the rule - passing ref directly -->
    <ChildComponent :count="count" />

    <!-- This should trigger the rule - passing object property that's a ref -->
    <ChildComponent :user="data.userRef" />

    <!-- This should NOT trigger the rule - passing unwrapped value -->
    <ChildComponent :count="count.value" />

    <!-- This should NOT trigger the rule - passing normal value -->
    <ChildComponent :static="data.normalValue" />
  </div>
</template>
