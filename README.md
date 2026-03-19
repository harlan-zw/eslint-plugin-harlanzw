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
- **AI Deslop Rules** - Clean AI-generated slop from content markdown

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
| [`nuxt-ui-prefer-shorthand-css`](./src/rules/nuxt-ui-prefer-shorthand-css.ts) | prefer Nuxt UI shorthand CSS classes over verbose `var()` syntax |
| **Vue** | |
| [`vue-no-faux-composables`](./src/rules/vue-no-faux-composables.md) | stop fake composables that don't use Vue reactivity |
| [`vue-no-nested-reactivity`](./src/rules/vue-no-nested-reactivity.md) | don't mix `ref()` and `reactive()` together |
| [`vue-no-passing-refs-as-props`](./src/rules/vue-no-passing-refs-as-props.md) | don't pass refs as props - unwrap them first |
| [`vue-no-reactive-destructuring`](./src/rules/vue-no-reactive-destructuring.md) | avoid destructuring reactive objects |
| [`vue-no-ref-access-in-templates`](./src/rules/vue-no-ref-access-in-templates.md) | don't use `.value` in Vue templates |
| [`vue-no-torefs-on-props`](./src/rules/vue-no-torefs-on-props.md) | don't use `toRefs()` on the props object |
| [`vue-no-reactivity-after-await`](./src/rules/vue-no-reactivity-after-await.md) | disallow subscription APIs (`watch`, `computed`, etc.) after `await` in async functions |
| [`vue-no-async-lifecycle-hook`](./src/rules/vue-no-async-lifecycle-hook.md) | disallow async callbacks in Vue lifecycle hooks |
| [`vue-no-resolve-component-in-composables`](./src/rules/vue-no-resolve-component-in-composables.ts) | disallow `resolveComponent()`/`resolveDirective()` outside top-level `<script setup>` |
| [`vue-require-composable-prefix`](./src/rules/vue-require-composable-prefix.ts) | enforce `use*` prefix for functions using Vue reactivity |
| **AI Deslop** | |
| [`ai-deslop-adverbs`](./src/prompt/rules/deslop-adverbs.ts) | remove unnecessary adverbs that add no meaning (e.g. "significantly", "fundamentally") |
| [`ai-deslop-autolink`](./src/prompt/rules/deslop-autolink.ts) | auto-link first mention of known tech terms to their canonical URLs |
| [`ai-deslop-buzzwords`](./src/prompt/rules/deslop-buzzwords.ts) | replace AI-generated buzzword phrases with simpler alternatives (e.g. "leverage" → "use") |
| [`ai-deslop-casing`](./src/prompt/rules/deslop-casing.ts) | enforce correct casing for tech terms, brands, and abbreviations (e.g. "github" → "GitHub") |
| [`ai-deslop-false-dichotomy`](./src/prompt/rules/deslop-false-dichotomy.ts) | flag "it's not X, it's Y" contrast patterns common in AI writing |
| [`ai-deslop-filler`](./src/prompt/rules/deslop-filler.ts) | remove AI-generated filler sentences and phrases (e.g. "it's worth noting that") |
| [`ai-deslop-hedging`](./src/prompt/rules/deslop-hedging.ts) | remove hedging/qualifying words that weaken copy (e.g. "very", "really", "quite", "just") |
| [`ai-deslop-no-exclamation`](./src/prompt/rules/deslop-no-exclamation.ts) | remove exclamation marks from content prose |
| [`ai-deslop-passive-voice`](./src/prompt/rules/deslop-passive-voice.ts) | flag passive voice constructions (e.g. "is generated" → rewrite in active voice) |
| [`ai-deslop-weak-opener`](./src/prompt/rules/deslop-weak-opener.ts) | flag weak sentence openers like "There is" and "It is possible to" |
<!-- rules:end -->

The plugin also includes 21 **prompt linting** rules for `.prompt.md` and `.skill.md` files. See the [prompt configs](#prompt-rules) section below.

## Installation

Install the plugin:

```bash
pnpm add -D eslint-plugin-harlanzw
```

## Usage

```js
// eslint.config.js
import harlanzw from 'eslint-plugin-harlanzw'

export default harlanzw({
  link: true,
  nuxt: true,
  vue: true,
})
```

### Link Options

All link rules share `ignoreExternal` and `exclude` options. Configure them once:

```js
export default harlanzw({
  link: {
    ignoreExternal: true, // skip http(s):// URLs and elements with `external` attr
    exclude: ['^/api/', '/OAuth/'], // skip URLs matching any regex pattern
    requireTrailingSlash: true, // passed to link-trailing-slash
  },
  nuxt: true,
  vue: true,
})
```

### Extra Configs

Pass additional flat configs as extra arguments:

```js
export default harlanzw(
  { link: true, nuxt: true, vue: true },
  {
    rules: {
      'harlanzw/link-lowercase': ['error', { ignoreExternal: true }],
    },
  },
)
```

### With @antfu/eslint-config

```js
import antfu from '@antfu/eslint-config'
import harlanzw from 'eslint-plugin-harlanzw'

export default antfu(
  { vue: true },
  ...harlanzw({ link: true, nuxt: true, vue: true }),
)
```

### With Nuxt ESLint

```ts
import harlanzw from 'eslint-plugin-harlanzw'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  ...harlanzw({ link: true, nuxt: true, vue: true }),
)
```

### Plugin Access

For custom configs or if you need the raw ESLint plugin object:

```js
import { plugin } from 'eslint-plugin-harlanzw'

export default [
  ...plugin.configs.recommended, // link + nuxt + vue
  // or pick:
  ...plugin.configs.link,
  ...plugin.configs.nuxt,
  ...plugin.configs.vue,
]
```

### AI Deslop Rules

10 rules for cleaning AI-generated slop from your content markdown files (`content/**/*.md`). Most rules are auto-fixable.

```js
// eslint.config.js
export default harlanzw({
  content: true,
})
```

Or use the raw config:

```js
import { plugin } from 'eslint-plugin-harlanzw'

export default [
  ...plugin.configs.content,
]
```

| Rule | What it does |
| --- | --- |
| `ai-deslop-buzzwords` | Replaces overused AI phrases with plain alternatives ("leverage" → "use", "delve into" → "explore") |
| `ai-deslop-filler` | Removes filler phrases that add nothing ("it's worth noting that", "at the end of the day") |
| `ai-deslop-adverbs` | Strips unnecessary adverbs ("significantly", "fundamentally", "essentially") |
| `ai-deslop-casing` | Fixes tech term casing using a 300+ term dictionary ("github" → "GitHub", "typescript" → "TypeScript") |
| `ai-deslop-autolink` | Links first mention of tech terms to their canonical URLs ("Nuxt" → `[Nuxt](https://nuxt.com)`) |
| `ai-deslop-false-dichotomy` | Flags "it's not X, it's Y" false contrast patterns |
| `ai-deslop-hedging` | Strips hedging words that weaken copy ("very", "really", "quite", "just", "somewhat") |
| `ai-deslop-no-exclamation` | Replaces exclamation marks with periods in content prose |
| `ai-deslop-passive-voice` | Flags passive voice ("is generated", "was created") for active rewriting |
| `ai-deslop-weak-opener` | Flags weak expletive openers ("There is", "It is possible to") |

### Prompt Rules

21 rules for linting `.prompt.md` and `.skill.md` files using a custom prompt language:

```js
import { plugin } from 'eslint-plugin-harlanzw'

export default [
  ...plugin.configs['prompt:recommended'],
  // or stricter:
  // ...plugin.configs['prompt:strict'],
  // for skill files:
  // ...plugin.configs['prompt:skill'],
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
