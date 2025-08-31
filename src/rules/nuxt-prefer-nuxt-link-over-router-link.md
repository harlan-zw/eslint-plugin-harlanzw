# nuxt-prefer-nuxt-link-over-router-link

Prefer NuxtLink over RouterLink in Nuxt applications.

## Rule Details

This rule recommends using `<NuxtLink>` instead of `<RouterLink>` in Nuxt applications. NuxtLink provides better performance optimizations, prefetching capabilities, and seamless integration with Nuxt's router system.

### ❌ Incorrect

```jsx
// In JSX/TSX files
<RouterLink to="/about">About</RouterLink>
<RouterLink to="/contact" className="nav-link">Contact</RouterLink>
```

```vue
<!-- In Vue SFC files -->
<template>
  <RouterLink to="/about">
    About
  </RouterLink>
  <RouterLink to="/contact" class="nav-link">
    Contact
  </RouterLink>
</template>
```

### ✅ Correct

```jsx
// In JSX/TSX files
<NuxtLink to="/about">About</NuxtLink>
<NuxtLink to="/contact" className="nav-link">Contact</NuxtLink>
```

```vue
<!-- In Vue SFC files -->
<template>
  <NuxtLink to="/about">
    About
  </NuxtLink>
  <NuxtLink to="/contact" class="nav-link">
    Contact
  </NuxtLink>
</template>
```

## Why?

NuxtLink offers several advantages over the standard RouterLink:

1. **Automatic Prefetching**: NuxtLink automatically prefetches linked pages when they appear in the viewport
2. **Better Performance**: Optimized for Nuxt's SSR/SSG rendering modes
3. **Enhanced Features**: Additional props like `prefetch`, `noPrefetch`, and better external link handling
4. **Consistent API**: Follows Nuxt conventions and integrations

## Fix

The rule provides an automatic fix that replaces `RouterLink` with `NuxtLink`:

```jsx
// Before
<RouterLink to="/page" className="link">Click me</RouterLink>

// After (auto-fixed)
<NuxtLink to="/page" className="link">Click me</NuxtLink>
```

## Full Support

This rule supports:
- ✅ Vue SFC files (`.vue` files with `<template>` sections)
- ✅ JSX/TSX files with React-style syntax
- ✅ Automatic fixing in both file types

## When Not To Use

This rule is specifically for Nuxt applications. If you're using Vue Router in a non-Nuxt context, you should disable this rule:

```json
{
  "rules": {
    "harlanzw/nuxt-prefer-nuxt-link-over-router-link": "off"
  }
}
```
