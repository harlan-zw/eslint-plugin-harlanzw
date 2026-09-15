# vue-prefer-theme-tokens

Prefer shared theme colors and spacing over hard-coded values in Vue classes.
Load this rule through the [Tailwind helper](./vue-valid-tailwind-classes.md).

```vue
<!-- Reports when --color-brand is #123456. -->
<div class="bg-[#123456]" />

<!-- Accepts named tokens and variable expressions. -->
<div class="bg-brand gap-4 p-(--panel-space)" />
```

The default accepts the loaded theme's named utilities.
It reports arbitrary values when Tailwind identifies an equivalent named utility.
It preserves unmatched brand colors and component spacing unless you configure a stricter policy.
Suggestions preserve variants. Pixel conversion never assumes a root font size.
Width and height remain layout choices. Safe-area expressions and CSS-variable expressions remain valid.
Generated CSS distinguishes text sizes from text colors.

## Site policy

```ts
await tailwind({
  stylesheet: './app/assets/css/main.css',
  colors: ['primary', 'muted', 'default', 'brand-*'],
  spacing: ['0', '0.5', '1', '2', '3', '4', '6', '8', '12', '16'],
  allow: ['bg-[#34a853]'], // A deliberate third-party brand color.
})
```

`colors` and `spacing` accept suffixes. `*` matches any characters.
Omit either option to report only known token equivalents.
Set `arbitraryValues: true` to reject other arbitrary colors and spacing too.
`allow` matches base utilities after removing responsive variants and important markers.
The class-validity rule accepts both complete class names and base utilities in `allow`.

Structural values such as `auto`, `px`, `inherit`, and `transparent` remain valid.
CSS-variable expressions remain valid because they reference shared tokens.
These checks express a site policy. They cannot decide a color's visual purpose.

No automatic replacement is safe when colors encode state or spacing affects layout.
The diagnostic points to the source stylesheet and configured choices.

## Limits

The rule shares the Vue class collector with the other design rules.
It does not inspect inline styles, standalone CSS declarations, or strings returned by imported helpers.
It does not inspect colors embedded inside images or arbitrary gradient functions.
Use file overrides for demos and third-party branding that intentionally use another design system.
