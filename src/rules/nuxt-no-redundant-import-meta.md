# nuxt-no-redundant-import-meta

> Disallow redundant `import.meta.server` or `import.meta.client` checks in scoped components

## Rule Details

This rule prevents redundant checks for `import.meta.server` or `import.meta.client` in Nuxt components that are already scoped by their filename suffix.

In Nuxt, components and files can be scoped to run only on the server or client using special filename suffixes:
- `.server.vue`, `.server.js`, `.server.ts` - Server-only files
- `.client.vue`, `.client.js`, `.client.ts` - Client-only files

When a file is already scoped using these suffixes, checking `import.meta.server` in a `.server.*` file or `import.meta.client` in a `.client.*` file is redundant and always returns `true`.

## Examples

### ❌ Incorrect

```vue
<!-- MyComponent.server.vue -->
<script setup>
// Redundant check - this component already runs server-only
if (import.meta.server) {
  console.log('This will always be true')
}
</script>
```

```vue
<!-- MyComponent.client.vue -->
<script setup>
// Redundant check - this component already runs client-only
if (import.meta.client) {
  console.log('This will always be true')
}
</script>
```

```ts
// utils/helper.server.ts
// Redundant check in server-only file
if (import.meta.server) {
  doServerStuff()
}
```

### ✅ Correct

```vue
<!-- MyComponent.server.vue -->
<script setup>
// Valid cross-check - might need client-specific code during SSR
if (import.meta.client) {
  console.log('This runs on client during hydration')
}

// Direct server code without redundant check
console.log('This always runs on server')
</script>
```

```vue
<!-- MyComponent.client.vue -->
<script setup>
// Valid cross-check - might need server-specific code during SSR
if (import.meta.server) {
  console.log('This runs on server during SSR')
}

// Direct client code without redundant check
console.log('This always runs on client')
</script>
```

```vue
<!-- MyComponent.vue (not scoped) -->
<script setup>
// Valid checks in non-scoped components
if (import.meta.server) {
  console.log('Server-side logic')
}

if (import.meta.client) {
  console.log('Client-side logic')
}
</script>
```

## When Not To Use

This rule only applies to files with Nuxt's scoping suffixes (`.server.*` or `.client.*`). It has no effect on regular components or files without these suffixes.

If you're not using Nuxt's file-based scoping system, this rule won't be useful for your project.

## Further Reading

- [Nuxt Server Components](https://nuxt.com/docs/guide/directory-structure/components#server-components)
- [Nuxt Client Components](https://nuxt.com/docs/guide/directory-structure/components#client-components)
- [import.meta in Nuxt](https://nuxt.com/docs/api/advanced/import-meta)
