# vue-require-composable-prefix

Functions using Vue reactivity should be named as composables.

If a function uses `ref()`, `reactive()`, `computed()`, `watch()`, or calls other composables, it should start with "use". This is the inverse of `vue-no-faux-composables` — together they enforce bidirectional naming consistency.

## Wrong

```ts
function getUser() {
  const user = ref(null) // uses reactivity, should be useGetUser
  return { user }
}

function fetchData() {
  const { data } = useFetch('/api/data') // calls a composable
  return { data }
}

const loadUser = () => {
  const x = ref(0)
  return { x }
}
```

## Right

```ts
function useGetUser() {
  const user = ref(null)
  return { user }
}

function useFetchData() {
  const { data } = useFetch('/api/data')
  return { data }
}

// Regular functions without reactivity are fine
function formatDate(date) {
  return date.toISOString()
}
```

## Excluded

The rule ignores:

- `define*` functions (e.g. `defineStore`, `defineComponent`)
- `setup()` functions
- Nested functions (only top-level scope is checked)
- Anonymous/unnamed functions
