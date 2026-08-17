# nuxt-no-redundant-component-imports

> Disallow `#components` imports used only as Vue template tags

Nuxt auto-imports components referenced as template tags. Explicit named imports
for those tags add noise and duplicate Nuxt's generated import.

This is a source clarity rule. Named `#components` imports are tree-shaken and
remain appropriate when code needs the component value.

## Incorrect

```vue
<script setup lang="ts">
import { NuxtLink, UiButton } from '#components'
</script>

<template>
  <NuxtLink to="/">
    <UiButton>Home</UiButton>
  </NuxtLink>
</template>
```

## Correct

```vue
<template>
  <NuxtLink to="/">
    <UiButton>Home</UiButton>
  </NuxtLink>
</template>
```

Keep the import when the script needs the component value:

```vue
<script setup lang="ts">
import { UiButton } from '#components'
import { h } from 'vue'

const button = h(UiButton)
</script>
```

Aliased imports also remain valid because removing them would change the local
template name:

```vue
<script setup lang="ts">
import { UiSkeleton as SkeletonComponent } from '#components'
</script>

<template>
  <SkeletonComponent />
</template>
```

The rule is autofixable. It removes only unaliased imports referenced solely as
template tags and preserves script references, dynamic `:is` bindings, type
imports, and aliases. An import that carries a comment between its specifiers is
reported without a fix, because removing one specifier would re-attach the
comment to the next one.

## When Not To Use It

Turn the rule off when the project sets `components: false` in `nuxt.config`.
Template auto-import is disabled there, so the explicit `#components` import is
required and removing it breaks the component.

## Further reading

* [Nuxt components directory](https://nuxt.com/docs/4.x/directory-structure/app/components)
