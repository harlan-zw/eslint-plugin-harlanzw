# link-no-double-slashes

Ensures link URLs do not contain consecutive slashes in the path.

Consecutive slashes in URLs can cause issues with routing, server interpretation, and SEO. This rule automatically removes extra slashes while preserving the URL structure and functionality.

## Wrong

```vue
<template>
  <a href="/path//with//double">Link</a>
  <NuxtLink to="/page//section">
    Navigation
  </NuxtLink>
  <RouterLink to="/router///page">
    Route
  </RouterLink>
  <a href="/path//to?query=1#hash">With params</a>
</template>
```

```jsx
<a href="/path//with//double">Link</a>
<NuxtLink to="/page//section">Navigation</NuxtLink>
<RouterLink to="/router///page">Route</RouterLink>
<a href="/path//to?query=1#hash">With params</a>
```

## Right

```vue
<template>
  <a href="/path/with/double">Link</a>
  <NuxtLink to="/page/section">
    Navigation
  </NuxtLink>
  <RouterLink to="/router/page">
    Route
  </RouterLink>
  <a href="/path/to?query=1#hash">With params</a>
</template>
```

```jsx
<a href="/path/with/double">Link</a>
<NuxtLink to="/page/section">Navigation</NuxtLink>
<RouterLink to="/router/page">Route</RouterLink>
<a href="/path/to?query=1#hash">With params</a>
```

## Auto-fix

This rule includes an auto-fix that will automatically clean up consecutive slashes:
- Multiple consecutive slashes are replaced with a single slash
- Query parameters (`?`) and hash fragments (`#`) are preserved
- Protocol-relative URLs (`//example.com`) and full URLs (`https://example.com`) are ignored

## Benefits

- **Routing**: Prevents routing conflicts and 404 errors
- **SEO**: Avoids duplicate content issues from URL variations
- **Server compatibility**: Reduces server-side path resolution issues
- **Clean URLs**: Maintains professional and readable URL structure

## Exceptions

The rule ignores:
- Protocol-relative URLs: `//example.com/path` ✓
- Full URLs with protocols: `https://example.com/path` ✓
- Dynamic attributes using expressions

The rule works with:
- `<a>` tags with `href` attributes
- `<NuxtLink>` components with `to` attributes
- `<RouterLink>` components with `to` attributes
