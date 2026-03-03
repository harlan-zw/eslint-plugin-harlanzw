# eslint-plugin-harlanzw

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

Harlan's ESLint rules for Vue projects with focus on link hygiene, Nuxt best practices, and Vue reactivity patterns.

<p align="center">
<table>
<tbody>
<td align="center">
<sub>Made possible by my <a href="https://github.com/sponsors/harlan-zw">Sponsor Program 💖</a><br> Follow me <a href="https://twitter.com/harlan_zw">@harlan_zw</a> 🐦</sub><br>
</td>
</tbody>
</table>
</p>

## Playground

Try the rules in action with a Nuxt ESLint interactive playground:

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/harlan-zw/eslint-plugin-harlanzw/tree/main/playground)

## Rules

> **Note:** These rules are experimental and may change. They will be submitted to the official Vue ESLint plugin for consideration.

The rules are organized into the following categories:

- **Link Rules** - Ensure link URLs are clean, accessible, and SEO-friendly
- **Nuxt Rules** - Best practices for Nuxt applications
- **Vue Rules** - Vue composition API and reactivity best practices

<!-- rules:start -->
| Rule | Description |
| --- | --- |
| **Link** | |
| [`link-ascii-only`](./src/rules/link-ascii-only.md) | ensure link URLs contain only ASCII characters |
| [`link-lowercase`](./src/rules/link-lowercase.md) | ensure link URLs do not contain uppercase characters |
| [`link-no-double-slashes`](./src/rules/link-no-double-slashes.md) | ensure link URLs do not contain consecutive slashes |
| [`link-no-underscores`](./src/rules/link-no-underscores.ts) | ensure link URLs do not contain underscores |
| [`link-no-whitespace`](./src/rules/link-no-whitespace.md) | ensure link URLs do not contain whitespace characters |
| [`link-require-descriptive-text`](./src/rules/link-require-descriptive-text.ts) | require descriptive link text |
| [`link-require-href`](./src/rules/link-require-href.ts) | require `href`/`to` attribute on link elements |
| [`link-trailing-slash`](./src/rules/link-trailing-slash.ts) | enforce trailing slash consistency on link URLs |
| **Nuxt** | |
| [`nuxt-await-navigate-to`](./src/rules/nuxt-await-navigate-to.md) | enforce awaiting `navigateTo()` calls |
| [`nuxt-no-redundant-import-meta`](./src/rules/nuxt-no-redundant-import-meta.md) | disallow redundant `import.meta.server` or `import.meta.client` checks in scoped components |
| [`nuxt-no-side-effects-in-async-data-handler`](./src/rules/nuxt-no-side-effects-in-async-data-handler.md) | disallow side effects in async data handlers |
| [`nuxt-no-side-effects-in-setup`](./src/rules/nuxt-no-side-effects-in-setup.md) | disallow side effects in setup functions |
| [`nuxt-prefer-navigate-to-over-router-push-replace`](./src/rules/nuxt-prefer-navigate-to-over-router-push-replace.md) | prefer `navigateTo()` over `router.push()` or `router.replace()` |
| [`nuxt-prefer-nuxt-link-over-router-link`](./src/rules/nuxt-prefer-nuxt-link-over-router-link.md) | prefer `NuxtLink` over `RouterLink` |
| **Vue** | |
| [`vue-no-faux-composables`](./src/rules/vue-no-faux-composables.md) | stop fake composables that don't use Vue reactivity |
| [`vue-no-nested-reactivity`](./src/rules/vue-no-nested-reactivity.md) | don't mix `ref()` and `reactive()` together |
| [`vue-no-passing-refs-as-props`](./src/rules/vue-no-passing-refs-as-props.md) | don't pass refs as props - unwrap them first |
| [`vue-no-reactive-destructuring`](./src/rules/vue-no-reactive-destructuring.md) | avoid destructuring reactive objects |
| [`vue-no-ref-access-in-templates`](./src/rules/vue-no-ref-access-in-templates.md) | don't use `.value` in Vue templates |
| [`vue-no-torefs-on-props`](./src/rules/vue-no-torefs-on-props.md) | don't use `toRefs()` on the props object |
<!-- rules:end -->

The plugin also includes 21 **prompt linting** rules for `.prompt.md` and `.skill.md` files. See the [prompt configs](#prompt-rules) section below.

## Installation

Install the plugin:

```bash
pnpm add -D eslint-plugin-harlanzw
```

## Usage

### Recommended (all rules)

```js
// eslint.config.js
import harlanzw from 'eslint-plugin-harlanzw'

export default [
  ...harlanzw.configs.recommended,
]
```

### Pick categories

```js
import harlanzw from 'eslint-plugin-harlanzw'

export default [
  ...harlanzw.configs.link,
  ...harlanzw.configs.nuxt,
  ...harlanzw.configs.vue,
]
```

Available configs: `link`, `nuxt`, `vue`, `recommended` (all three combined).

### With @antfu/eslint-config

```js
import antfu from '@antfu/eslint-config'
import harlanzw from 'eslint-plugin-harlanzw'

export default antfu(
  { vue: true },
  ...harlanzw.configs.recommended,
)
```

### With Nuxt ESLint

```ts
import harlanzw from 'eslint-plugin-harlanzw'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  ...harlanzw.configs.recommended,
)
```

### Prompt Rules

The plugin includes 21 rules for linting `.prompt.md` and `.skill.md` files. These use a custom prompt language and have separate configs:

```js
import harlanzw from 'eslint-plugin-harlanzw'

export default [
  ...harlanzw.configs['prompt:recommended'],
  // or stricter:
  // ...harlanzw.configs['prompt:strict'],
  // for skill files:
  // ...harlanzw.configs['prompt:skill'],
]
```

## Sponsors

<p align="center">
  <a href="https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg">
    <img src='https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg' alt="Sponsors"/>
  </a>
</p>

## Credits

This plugin is based on [eslint-plugin-antfu](https://github.com/antfu/eslint-plugin-antfu) by Anthony Fu.

## License

Licensed under the [MIT license](https://github.com/harlan-zw/eslint-plugin-harlanzw/blob/main/LICENSE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/eslint-plugin-harlanzw?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/eslint-plugin-harlanzw
[npm-downloads-src]: https://img.shields.io/npm/dm/eslint-plugin-harlanzw?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/eslint-plugin-harlanzw

[license-src]: https://img.shields.io/github/license/harlan-zw/eslint-plugin-harlanzw.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/harlan-zw/eslint-plugin-harlanzw/blob/main/LICENSE
