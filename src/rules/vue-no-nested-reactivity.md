# vue-no-nested-reactivity

Don't mix `ref()` and `reactive()` together.

Nesting reactive primitives gets confusing fast. Pick one approach and stick with it.

## Wrong

```vue
<script setup>
// Don't nest refs inside reactive
const state = reactive({
  count: ref(0) // confusing!
})

// Don't nest reactive inside ref
const data = ref({
  state: reactive({ count: 0 }) // why?
})

// Don't return refs from computed
const computedRef = computed(() => ref(0)) // just return the value
</script>
```

## Right

```vue
<script setup>
// Pick one: all refs
const count = ref(0)
const message = ref('hello')

// Or all reactive
const state = reactive({
  count: 0,
  message: 'hello'
})

// Computed returns plain values
const doubled = computed(() => state.count * 2)
</script>
```

Nested reactivity creates confusing types like `Ref<Reactive<T>>` and makes it unclear how to access your data. Keep it simple.
