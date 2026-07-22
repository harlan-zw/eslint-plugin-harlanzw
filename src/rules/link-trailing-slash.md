# link-trailing-slash

Enforce one trailing slash policy for static links in Vue templates and JSX.

The rule changes the URL path only. Query parameters and hash fragments stay in place.

## Default behavior

The default removes trailing slashes.

```vue
<a href="/about/">About</a>
<a href="/about/?ref=nav#team">Team</a>
```

becomes:

```vue
<a href="/about">About</a>
<a href="/about?ref=nav#team">Team</a>
```

The root path `/`, fragment-only links, URLs with a scheme, and dynamic attributes are left alone.

## Requiring trailing slashes

Set `requireTrailingSlash` through the package factory:

```js
import { harlanzw } from 'eslint-plugin-harlanzw'

export default harlanzw({
  link: {
    requireTrailingSlash: true,
  },
})
```

`/about?ref=nav#team` then becomes `/about/?ref=nav#team`.

## Shared link options

`ignoreExternal` skips HTTP links and elements marked `external`. `exclude` accepts regular expression strings for paths the rule should ignore.

## Fixes

The rule is auto-fixable. It supports static `href` and `to` attributes on `<a>`, `<NuxtLink>`, and `<RouterLink>` elements.
