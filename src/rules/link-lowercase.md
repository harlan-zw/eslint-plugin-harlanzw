# link-lowercase

Ensures link URLs do not contain uppercase characters.

Uppercase characters in URLs can cause issues with case-sensitive servers and create duplicate content problems for SEO. This rule automatically converts URLs to lowercase to ensure consistency and avoid potential issues.

## Wrong

```vue
<template>
  <a href="/Page">Link</a>
  <NuxtLink to="/About-Us">About page</NuxtLink>
  <RouterLink to="/Contact-Page">Contact</RouterLink>
</template>
```

```jsx
<a href="/Page">Link</a>
<NuxtLink to="/About-Us">About page</NuxtLink>
<RouterLink to="/Contact-Page">Contact</RouterLink>
```

## Right

```vue
<template>
  <a href="/page">Link</a>
  <NuxtLink to="/about-us">About page</NuxtLink>
  <RouterLink to="/contact-page">Contact</RouterLink>
</template>
```

```jsx
<a href="/page">Link</a>
<NuxtLink to="/about-us">About page</NuxtLink>
<RouterLink to="/contact-page">Contact</RouterLink>
```

## Auto-fix

This rule includes an auto-fix that will automatically convert URLs to lowercase:
- All uppercase letters are converted to lowercase
- Hyphens, numbers, and special characters are preserved
- The entire URL path, query parameters, and hash fragments are converted

## Benefits

- **SEO**: Prevents duplicate content issues caused by case variations
- **Server compatibility**: Works with case-sensitive web servers
- **Consistency**: Maintains a uniform URL structure across your application

The rule works with:
- `<a>` tags with `href` attributes
- `<NuxtLink>` components with `to` attributes  
- `<RouterLink>` components with `to` attributes

Dynamic attributes (using expressions) are not checked by this rule.