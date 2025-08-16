# eslint-plugin-harlanzw

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

Harlan's ESLint rules for Vue projects.

<p align="center">
<table>
<tbody>
<td align="center">
<sub>Made possible by my <a href="https://github.com/sponsors/harlan-zw">Sponsor Program 💖</a><br> Follow me <a href="https://twitter.com/harlan_zw">@harlan_zw</a> 🐦</sub><br>
</td>
</tbody>
</table>
</p>

## Rules

> **Note:** These rules are experimental and may change. They will be submitted to the official Vue ESLint plugin for consideration.

<!-- rules:start -->
- [`vue-no-faux-composables`](./src/rules/vue-no-faux-composables.md) - stop fake composables that don't use Vue reactivity
- [`vue-no-nested-reactivity`](./src/rules/vue-no-nested-reactivity.md) - don't mix `ref()` and `reactive()` together
- [`vue-no-passing-refs-as-props`](./src/rules/vue-no-passing-refs-as-props.md) - don't pass refs as props - unwrap them first
- [`vue-no-ref-access-in-templates`](./src/rules/vue-no-ref-access-in-templates.md) - don't use `.value` in Vue templates
- [`vue-no-torefs-on-props`](./src/rules/vue-no-torefs-on-props.md) - don't use `toRefs()` on the props object
<!-- rules:end -->

## Installation

Install the plugin:

```bash
pnpm add -D eslint-plugin-harlanzw
```

## Usage

### With @antfu/eslint-config

```js
// eslint.config.js
import antfu from '@antfu/eslint-config'
import harlanzw from 'eslint-plugin-harlanzw'

export default antfu(
  {
    vue: true,
  },
  {
    plugins: {
      harlanzw
    },
    rules: {
      'harlanzw/vue-no-faux-composables': 'error',
      'harlanzw/vue-no-nested-reactivity': 'error',
      'harlanzw/vue-no-passing-refs-as-props': 'error',
      'harlanzw/vue-no-ref-access-in-templates': 'error',
      'harlanzw/vue-no-torefs-on-props': 'error'
    }
  }
)
```

### Standalone Usage

Add the plugin to your ESLint configuration:

```js
// eslint.config.js
import harlanzw from 'eslint-plugin-harlanzw'
import vueParser from 'vue-eslint-parser'

export default [
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser
    },
    plugins: {
      harlanzw
    },
    rules: {
      'harlanzw/vue-no-faux-composables': 'error',
      'harlanzw/vue-no-nested-reactivity': 'error',
      'harlanzw/vue-no-passing-refs-as-props': 'error',
      'harlanzw/vue-no-ref-access-in-templates': 'error',
      'harlanzw/vue-no-torefs-on-props': 'error'
    }
  }
]
```


## Sponsors

<p align="center">
  <a href="https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg">
    <img src='https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg'/>
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
