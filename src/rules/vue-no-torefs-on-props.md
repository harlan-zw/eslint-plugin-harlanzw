# vue-no-torefs-on-props

Don't use `toRefs()` on props.

Props are already reactive in Vue, so wrapping them with `toRefs()` is pointless.

## Wrong

```vue
<script setup>
const props = defineProps<{ name: string }>()
const { name } = toRefs(props)  // unnecessary!
</script>
```

## Right

```vue
<script setup>
const props = defineProps<{ name: string }>()
// Just use props directly - they're already reactive
console.log(props.name)

// Or destructure (but loses reactivity)
const { name } = props
</script>
```

You only need `toRefs()` for regular reactive objects, not props.
