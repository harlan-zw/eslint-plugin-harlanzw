# vue-valid-tailwind-classes

Check static Vue classes against the site's Tailwind compiler and CSS declarations.

```ts
import { tailwind } from 'eslint-plugin-harlanzw/tailwind'

export default [
  // Your existing Vue parser configuration goes first.
  await tailwind({ stylesheet: './app/assets/css/main.css' }),
]
```

Install `@tailwindcss/node@~4.3.3` alongside your Tailwind v4 dependencies.
This optional entry uses Tailwind's design-system API. The regular plugin does not load the compiler.

```vue
<!-- Reports invalid utility names and variants. -->
<div class="bg-brnad hovr:p-4 font-sm" />

<!-- Uses the loaded theme and valid arbitrary dimensions. -->
<div class="bg-brand p-4 w-[37px]" />
```

## Configuration

`tailwind()` returns one flat ESLint configuration block.
Append it after your existing Nuxt or Vue configuration.

| Option | Meaning |
| --- | --- |
| `stylesheet` | Required CSS entry. Relative paths use the lint process directory. |
| `stylesheets` | Additional CSS entries loaded by this site, including Nuxt layer styles. |
| `files` | Vue file patterns. Defaults to `**/*.vue`. |
| `ignores` | Replaces default exclusions for `**/OgImage/**` and `**/*.takumi.vue`. |
| `allow` | Approved class patterns. `*` matches any characters. |
| `strict` | Also report unknown custom class names. Defaults to `false`. |
| `colors` | Approved color suffixes for the theme-token rule. |
| `arbitraryValues` | Reject arbitrary colors and spacing even without a known equivalent. Defaults to `false`. |
| `spacing` | Approved spacing suffixes for the theme-token rule. |

The helper loads CSS imports and their theme extensions.
Include generated Nuxt UI CSS, such as `.nuxt/ui.css`, in `stylesheets` after running Nuxt prepare.
Monorepos need separate configuration blocks when apps load different themes.
The helper does not execute Nuxt configuration or discover its CSS entries.
Missing files, unresolved imports, and invalid stylesheets stop configuration loading with their original error.
Tailwind may execute configured CSS plugins and JavaScript configuration, as during a normal build.

The default checks names that use known utility prefixes.
It leaves unknown hook names alone because another component or library may own their CSS.
Strict mode requires custom classes to appear in the loaded stylesheets, current Vue styles, or `allow`.

Classes declared in the current component's CSS and PostCSS `<style>` blocks remain valid.
Preprocessor styles need compiled CSS in `stylesheets`, or explicit class allowances.
`group`, `peer`, named group markers, and `not-prose` remain valid without emitted CSS.
Do not use strict mode without registering external hooks and styles.

## Coverage

The rule checks static `class`, bound arrays and objects, conditional branches, constants, and `:ui` slots.
It does not evaluate helper calls, imported class variables, object spreads, or arbitrary runtime expressions.
Use `vue-no-dynamic-tailwind-classes` for partial class construction.

Validation uses the complete candidate, including variants and important markers.
It does not change appearance automatically.
Unknown utility roots require strict mode to detect spelling mistakes.

## Caching

Load the helper once in your ESLint configuration.
It caches candidate compilation during that lint run.
Stylesheet and imported-file fingerprints invalidate ESLint's persistent result cache on the next configuration load.
Restart the editor's ESLint service after changing theme configuration.

The adapter is tested with `@tailwindcss/node` 4.3.3.
Its design-system API is unstable. Check adapter tests when upgrading Tailwind.
It does not support Tailwind v3.
