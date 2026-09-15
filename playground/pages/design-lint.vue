<script setup lang="ts">
const active = ref(false)
</script>

<template>
  <main class="mx-auto max-w-lg p-8">
    <h1 class="text-2xl font-semibold">
      Nuxt UI design rules
    </h1>
    <p class="mt-2 text-muted">
      Button appearance comes from shared styling and component props.
    </p>
    <UButton class="mt-6" size="lg" :ui="{ label: 'truncate' }" @click="active = !active">
      Toggle status
    </UButton>
    <UBadge class="ml-3" :color="active ? 'success' : 'neutral'">
      {{ active ? 'Active' : 'Inactive' }}
    </UBadge>
    <p class="mt-4" :class="active ? 'text-primary' : 'text-muted'">
      Both status colors use complete class names.
    </p>
  </main>
</template>
