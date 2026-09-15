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

The rule checks `UButton` and `UBadge` by default.
It reports other classes on these components, including unrecognized custom classes.
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
It remains off unless you enable `nuxtUi`.

For raw configs, use `plugin.configs.nuxtUi` with a Vue parser.
For one rule, configure `harlanzw/nuxt-ui-no-restyle` directly.

## Options

| Option | Meaning |
| --- | --- |
| `source` | Shared styling path shown in messages. Defaults to `app/app.config.ts`. |
| `components` | Component names mapped to options. `false` disables a component. |
| `components[name].allow` | Allowed base classes. Replaces the default layout allowance. |
| `components[name].slots` | Allowed classes per `ui` slot. Replaces the component allowance for that slot. |
| `components[name].sizes` | Site-supported values shown in size guidance. |
| `components[name].variants` | Site-supported values shown in appearance guidance. |
| `components[name].message` | Custom repair guidance. Replaces the built-in guidance. |

Names accept PascalCase and kebab-case.
Register custom Nuxt UI prefixes and local wrappers through `components`.
Unspecified components keep their defaults.
An empty `allow` array permits no classes. Use `['*']` to allow every class.

Patterns match whole base classes. `*` matches any characters.
Responsive and state variants, negative prefixes, and important markers do not change matching.
For example, `mt-*` permits `md:-mt-4!`.
Patterns do not inspect the resulting CSS.

Default allowed classes:

- Margins: `m-*`, `mx-*`, `my-*`, `mt-*`, `mr-*`, `mb-*`, `ml-*`, `ms-*`, `me-*`.
- Width: `w-full`, `w-auto`.
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

If a wrapper owns its own appearance, disable this rule inside that wrapper through a file override.
Keep the dynamic-class rule enabled there.

## Coverage and limits

Checks include static classes, conditional classes, arrays, object bindings, and literal `ui` slots.
Top-level `const` bindings are followed, including aliases. Template locals take precedence.
Known imports from `@nuxt/ui` and `#components` support aliases.
Foreign imports shadow default auto-import names. Explicit component configuration takes precedence.

The rule does not resolve imported class values, helper calls, mutable bindings, or props spreads.
It does not trace wrappers, namespace imports, CSS selectors, or runtime changes to objects.
It supports Vue templates, not JSX or standalone stylesheets.
Use browser review for visual quality and interaction behavior.

The component-policy idea was inspired by [shadcn lint](https://github.com/shadcn-ui/lint).
This implementation uses our own Vue rules and has no shadcn dependency.
