# nuxt-ui-no-restyle

Keep component appearance in props and shared Nuxt UI styling.
Use classes for placement and site-approved exceptions.

```vue
<!-- Passes. -->
<UButton size="lg" variant="outline" class="mt-4 md:w-full" />

<!-- Reports both overrides. -->
<UButton class="p-4 rounded-full" />

<!-- Slot overrides follow the same rules. -->
<UButton :ui="{ base: 'p-4' }" />
```

Defaults cover `UButton`, `UBadge`, `UInput`, `UTextarea`, `USelect`, `USelectMenu`, `UInputMenu`,
`UCheckbox`, `URadioGroup`, `USwitch`, and `UAvatar`.
It reports size and appearance utilities on these components.
Layout utilities and unknown custom hooks remain valid.
It does not change code automatically.

## Site configuration

Enable the checks in your existing Nuxt ESLint config:

```js
import { harlanzw } from 'eslint-plugin-harlanzw'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  ...harlanzw({
    nuxt: true,
    vue: true,
    nuxtUi: {
      source: 'app/app.config.ts',
      components: {
        UButton: {
          sizes: ['xs', 'sm', 'md', 'lg', 'xl'],
          slots: { label: ['truncate'] },
        },
        UBadge: false,
        BrandButton: {
          allow: ['mt-*', 'w-full'],
          message: 'Use the density prop. See app/components/BrandButton.vue.',
        },
      },
    },
  }),
)
```

No Nuxt runtime module is required for linting.
Nuxt ESLint supplies the Vue parser. Nuxt UI supplies the rendered components.
The preset adds a styling warning and a partial-class error on `.vue` files.
The factory enables it when the current package declares `@nuxt/ui` in dependencies or devDependencies.
Use `nuxtUi: false` to disable it.
If a different workspace package owns `@nuxt/ui`, set `nuxtUi: true` or pass component options.

For raw configs, use `plugin.configs.nuxtUi` with a Vue parser.
For one rule, configure `harlanzw/nuxt-ui-no-restyle` directly.

## Options

| Option | Meaning |
| --- | --- |
| `source` | Shared styling path shown in messages. Defaults to `app/app.config.ts`. |
| `components` | Component names mapped to options. `false` disables a component. |
| `components[name].extends` | Nuxt UI primitive whose prop values the wrapper forwards, such as `UInput`. |
| `components[name].classProps` | Base utility patterns mapped to their owning prop, such as `{ 'font-mono': 'mono' }`. |
| `components[name].forbiddenProps` | Styling props removed by the wrapper, such as `color` and `variant`. |
| `components[name].allow` | Allowed base classes or complete classes with variants. Replaces the default layout allowance. |
| `components[name].slots` | Allowed classes per `ui` slot. Replaces the component allowance for that slot. |
| `components[name].sizes` | Supported size values used for validation and guidance. |
| `components[name].appearanceProp` | Appearance prop named in guidance, such as `purpose`. Defaults to `color or variant`. |
| `components[name].variants` | Supported appearance values used for validation and guidance. |
| `components[name].colors` | Supported color prop values. |
| `components[name].message` | Custom repair guidance. Replaces the built-in guidance. |

Names accept PascalCase and kebab-case.
Register custom Nuxt UI prefixes and local wrappers through `components`.
Unspecified components keep their defaults.
An empty `allow` array permits no classes. Use `['*']` to allow every class.

Patterns match whole base classes or complete classes. `*` matches any characters.
Base patterns ignore responsive and state variants, negative prefixes, and important markers.
For example, `mt-*` permits `md:-mt-4!`.
Patterns containing variants match the complete class, including variant order and important markers.
For example, `focus-visible:ring-*` permits `focus-visible:ring-2`, but still reports `ring-2` and `hover:ring-2`.
Use `[&_button]:size-11` to approve that descendant target without approving every component's `size-11`.
The same matching applies to `slots` allowances.
Patterns do not inspect the resulting CSS.

Default allowed classes:

- Margins: `m-*`, `mx-*`, `my-*`, `mt-*`, `mr-*`, `mb-*`, `ml-*`, `ms-*`, `me-*`.
- Layout dimensions: `w-*`, `min-w-*`, `max-w-*`, `h-full`, `h-auto`, `min-h-*`, `max-h-*`.
- Placement: `self-*`, `justify-self-*`, `order-*`, `col-*`, `row-*`.
- Flex sizing: `grow`, `grow-*`, `shrink`, `shrink-*`, `basis-*`.

## Shared styling

Define repeated appearance in `app/app.config.ts`, or the equivalent file in your site:

```ts
export default defineAppConfig({
  ui: {
    button: {
      defaultVariants: { size: 'lg' },
      slots: { base: 'rounded-lg' },
    },
  },
})
```

Lint options describe the site's policy. They do not replace Nuxt UI configuration.
The rule does not execute `app.config.ts` or discover its sizes and variants.
Keep configured guidance consistent with your site's installed Nuxt UI version.
When Tailwind context is loaded, font-size utilities and direct CSS classes receive sizing guidance.
This includes custom tokens and classes declared with `@apply`, such as NuxtSEO's `text-mini`.
The rule does not infer sizing from ancestor selectors or runtime styles.

If a wrapper owns its own appearance, disable this rule inside that wrapper through a file override.
Keep the dynamic-class rule enabled there.

## Coverage and limits

Checks include static classes, conditional classes, arrays, object bindings, and literal `ui` slots.
For `ui` object spreads, only effective slot values are checked.
An unknown spread or computed key hides earlier slot values. Explicit later values remain checked.
Top-level `const` bindings are followed, including aliases. Template locals take precedence.
Known imports from `@nuxt/ui` and `#components` support aliases.
Foreign imports shadow default auto-import names. Explicit component configuration takes precedence.

The rule does not resolve imported class values, helper calls, mutable bindings, or props spreads.
Register wrappers explicitly. The rule does not infer wrapper APIs from their source.
Configured wrappers support named import aliases and default imports from matching `.vue` filenames.
It does not trace namespace imports, CSS selectors, or runtime changes to objects.
It supports Vue templates, not JSX or standalone stylesheets.
Use browser review for visual quality and interaction behavior.

The component-policy idea was inspired by [shadcn lint](https://github.com/shadcn-ui/lint).
This implementation uses our own Vue rules and has no shadcn dependency.


## Wrapped components

A wrapper can change the underlying Nuxt UI API.
For example, nuxtseo.com's `UiButton` exposes `purpose`, while `UiCard` defines its own sizes.
Configure those public props directly:

```ts
export default withNuxt(
  ...harlanzw({
    nuxtUi: {
      source: 'layers/design-system/app/app.config.ts',
      components: {
        UiButton: {
          sizes: ['xs', 'sm', 'md', 'lg', 'xl'],
          appearanceProp: 'purpose',
          variants: ['cta', 'secondary', 'quiet', 'danger', 'link'],
        },
        UiInput: { sizes: ['xs', 'sm', 'md', 'lg', 'xl'] },
        UiSelect: { sizes: ['xs', 'sm', 'md', 'lg', 'xl'] },
        UiCard: {
          sizes: ['xs', 'sm', 'md', 'lg'],
          appearanceProp: 'variant',
        },
        UiStatusBadge: {
          sizes: ['sm', 'md'],
          appearanceProp: 'status',
        },
      },
    },
  }),
  {
    files: ['layers/design-system/app/components/**/*.vue'],
    rules: { 'harlanzw/nuxt-ui-no-restyle': 'off' },
  },
)
```

The file override lets wrappers implement their shared appearance.
Call sites still receive warnings for padding, dimensions, text sizes, and other overrides.
This includes classes inside `:ui` slots.
Existing defaults remain valid. Callers do not need an explicit `size` on every component.
Margins, widths, and container-relative heights remain allowed.

Do not register components without a relevant styling API.
For example, nuxtseo.com's `UiIcon` accepts icon names and uses classes for dimensions.
Its `size-4` class remains valid.

The rule validates literal size, color, and appearance prop values.
Built-in values follow Nuxt UI v4. Component options replace their respective value lists.
An empty list disables validation for that prop.
Wrappers use their configured lists and appearance prop name.
Bound literals, constant aliases, and static conditional branches are checked.
Other runtime expressions remain TypeScript's responsibility.
No pixel-to-size autofix is safe because wrapper defaults and themes can change their dimensions.

Minimum and maximum heights remain valid because sites use them for accessible touch targets and container constraints.
Direct height, padding, and text-size overrides still receive prop guidance.
Opacity and visibility changes remain valid interaction styles.

## Wrapper contracts

Declare the wrapper API instead of inferring behavior from its name:

```ts
components: {
  UiInput: { extends: 'UInput' },
  UiSelect: { extends: 'USelect' },
  UiButton: {
    extends: 'UButton',
    appearanceProp: 'purpose',
    variants: ['cta', 'secondary', 'quiet', 'danger', 'link'],
    forbiddenProps: ['color', 'variant'],
  },
  UiCard: { sizes: ['xs', 'sm', 'md', 'lg'], variants: ['default', 'subtle'] },
}
```

Explicit arrays override inherited prop values.
Custom wrappers have no assumed size or color values without a declared contract.
Radius, border, and font overrides point to shared styling instead of an unrelated appearance prop.
Forbidden props report even when their bound value is dynamic.
Object-form `v-bind` follows local constants and object spreads in Vue attribute order.
Unknown spreads invalidate earlier values. Known forbidden prop names still report.
Bindings that mutate, escape through calls, or mutate through aliases remain unknown.

Load generated Nuxt UI CSS through `tailwind({ stylesheets: ['./.nuxt/ui.css'], stylesheet: '...' })`.
This accepts additional Nuxt UI semantic colors, such as `important`, from the generated theme.
Explicit `colors` arrays still enforce the site's approved values.

Restyle warnings identify overrides. They do not prove visual defects.
Keep documented exceptions for code typography, branded content, and accessible touch targets.
Use file overrides for primitive definitions and deliberate component demonstrations.

Automatic detection skips known Nuxt UI versions below v4. Explicit `nuxtUi` configuration overrides detection.

Complete classes beside interpolated class fragments still receive style checks.
Class and `ui` values inside object-form `v-bind` remain outside class extraction.
