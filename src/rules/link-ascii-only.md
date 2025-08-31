# link-ascii-only

Ensures link URLs contain only ASCII characters.

Non-ASCII characters in URLs can cause compatibility issues with older browsers, servers, and URL parsers. This rule automatically URL-encodes any non-ASCII characters found in link URLs to ensure maximum compatibility.

## Wrong

```vue
<template>
  <a href="/página">Spanish page</a>
  <NuxtLink to="/测试">Chinese test</NuxtLink>
  <RouterLink to="/café">French café</RouterLink>
</template>
```

```jsx
<a href="/página">Spanish page</a>
<NuxtLink to="/测试">Chinese test</NuxtLink>
<RouterLink to="/café">French café</RouterLink>
```

## Right

```vue
<template>
  <a href="/p%C3%A1gina">Spanish page</a>
  <NuxtLink to="/%E6%B5%8B%E8%AF%95">Chinese test</NuxtLink>
  <RouterLink to="/caf%C3%A9">French café</RouterLink>
</template>
```

```jsx
<a href="/p%C3%A1gina">Spanish page</a>
<NuxtLink to="/%E6%B5%8B%E8%AF%95">Chinese test</NuxtLink>
<RouterLink to="/caf%C3%A9">French café</RouterLink>
```

## Auto-fix

This rule includes an auto-fix that will automatically URL-encode non-ASCII characters using `encodeURI()`:
- Accented characters like `á`, `é`, `ñ` are properly encoded
- Unicode characters from any language are encoded
- The encoding preserves the semantic meaning while ensuring ASCII-only URLs

The rule works with:
- `<a>` tags with `href` attributes
- `<NuxtLink>` components with `to` attributes  
- `<RouterLink>` components with `to` attributes

Dynamic attributes (using expressions) are not checked by this rule.