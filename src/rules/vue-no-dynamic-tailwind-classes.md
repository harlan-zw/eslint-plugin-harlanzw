# vue-no-dynamic-tailwind-classes

Use complete Tailwind classes in Vue `:class` and `:ui` bindings.
Partial names prevent reliable source scanning and design checks.

```vue
<!-- Reports partial names. -->
<div :class="`bg-${color}-500`" />
<UButton :ui="{ base: 'p-' + size }" />

<!-- Passes. -->
<div :class="active ? 'bg-primary' : 'bg-muted'" />
<div :class="['p-4', { 'w-full': wide }]" />
```

The rule checks plain elements and components.
It accepts dynamic choices between complete classes.
It also accepts whole-class interpolation between whitespace boundaries.

```vue
<div :class="`p-4 ${extraClasses}`" />
```

Top-level `const` values can be resolved locally.
Partial interpolation still reports when its value is a literal, such as `` `p-${4}` ``.
Tailwind scans source text and does not evaluate these expressions.
The rule leaves unknown whole-class values alone.
Imported values, helper calls, mutable bindings, and props spreads remain unchecked.

The rule does not check whether Tailwind generates CSS for a complete class.
It does not change code automatically.
It supports Vue templates, not JSX or standalone stylesheets.

Enable it through `harlanzw({ nuxtUi: true })`, or configure the rule directly:

```js
{
  rules: {
    'harlanzw/vue-no-dynamic-tailwind-classes': 'error',
  },
}
```

The host ESLint config must supply `vue-eslint-parser` for `.vue` files.
The rule has no options.

Recognized Tailwind families, variants, and opacity modifiers report partial construction.
Authored CSS families and library hooks, such as `zone-band--${zone}` and `shj-lang-${language}`, remain valid.
Loaded theme CSS and local CSS distinguish custom families from Tailwind utilities.
Without a loaded theme, the rule uses common Tailwind prefixes.
It cannot prove every runtime class has generated CSS.

Complete classes beside an interpolation still receive the other design checks.
Mutable bindings remain unknown rather than producing reports from stale initializer values.
