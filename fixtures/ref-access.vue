<script lang="ts" setup>
import { ref } from 'vue'

const foo = { bar: ref('hello world') }
</script>

<template>
  <div v-html="foo.bar.value" />
</template>
