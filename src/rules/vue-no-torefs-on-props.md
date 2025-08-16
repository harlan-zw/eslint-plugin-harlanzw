# vue-no-torefs-on-props

Don't use `toRefs()` on props.

Props are already reactive in Vue, so wrapping them with `toRefs()` is pointless.

## Wrong

```ts
const props = defineProps<{ name: string }>()
const { name } = toRefs(props)  // unnecessary!
```

## Right

```ts
const props = defineProps<{ name: string }>()
const { name } = props  // props are already reactive
```

You only need `toRefs()` for regular reactive objects, not props.
