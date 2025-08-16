# eslint-plugin-harlanzw

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

Harlan's opinionated ESLint rules for better code quality and consistency.

<p align="center">
<table>
<tbody>
<td align="center">
<sub>Made possible by my <a href="https://github.com/sponsors/harlan-zw">Sponsor Program 💖</a><br> Follow me <a href="https://twitter.com/harlan_zw">@harlan_zw</a> 🐦</sub><br>
</td>
</tbody>
</table>
</p>

## Features

D
- 🚫 Prevent faux composables that don't use Vue's reactivity
- 📦 Avoid passing refs as props in Vue components
- 🎯 Prevent direct ref access in Vue templates
- ⚡ Disallow toRefs usage on props object

## Installation

Install `eslint-plugin-harlanzw` dependency to your project:

```bash
npm install eslint-plugin-harlanzw --save-dev
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

export default [
  {
    plugins: {
      harlanzw
    },
    rules: {
      'harlanzw/vue-no-faux-composables': 'error',
      'harlanzw/vue-no-passing-refs-as-props': 'error',
      'harlanzw/vue-no-ref-access-in-templates': 'error',
      'harlanzw/vue-no-torefs-on-props': 'error'
    }
  }
]
```

## Rules

[📖 View all rules documentation](./src/rules)

## Sponsors

<p align="center">
  <a href="https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg">
    <img src='https://raw.githubusercontent.com/harlan-zw/static/main/sponsors.svg'/>
  </a>
</p>

## License

Licensed under the [MIT license](https://github.com/harlan-zw/eslint-plugin-harlanzw/blob/main/LICENSE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/eslint-plugin-harlanzw?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/eslint-plugin-harlanzw
[npm-downloads-src]: https://img.shields.io/npm/dm/eslint-plugin-harlanzw?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/eslint-plugin-harlanzw

[license-src]: https://img.shields.io/github/license/harlan-zw/eslint-plugin-harlanzw.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/harlan-zw/eslint-plugin-harlanzw/blob/main/LICENSE
