# link-no-whitespace

Ensures link URLs do not contain whitespace characters.

Whitespace characters in URLs can cause issues with URL parsing, accessibility tools, and SEO. This rule automatically URL-encodes any whitespace characters found in link URLs.

## Wrong

```vue
<template>
  <a href="/path with spaces">Link</a>
  <NuxtLink to="/page with spaces">
    Link
  </NuxtLink>
  <RouterLink to="/router	page">
    Link
  </RouterLink>
</template>
```

```jsx
<a href="/path with spaces">Link</a>
<NuxtLink to="/page with spaces">Link</NuxtLink>
<RouterLink to="/router	page">Link</RouterLink>
```

## Right

```vue
<template>
  <a href="/path%20with%20spaces">Link</a>
  <NuxtLink to="/page%20with%20spaces">
    Link
  </NuxtLink>
  <RouterLink to="/router%09page">
    Link
  </RouterLink>
</template>
```

```jsx
<a href="/path%20with%20spaces">Link</a>
<NuxtLink to="/page%20with%20spaces">Link</NuxtLink>
<RouterLink to="/router%09page">Link</RouterLink>
```

## Auto-fix

This rule includes an auto-fix that will automatically URL-encode whitespace characters:
- Spaces become `%20`
- Tabs become `%09`
- Other whitespace characters are encoded accordingly

The rule works with:
- `<a>` tags with `href` attributes
- `<NuxtLink>` components with `to` attributes
- `<RouterLink>` components with `to` attributes

Dynamic attributes (using expressions) are not checked by this rule.
