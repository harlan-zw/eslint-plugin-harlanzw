import { reactive, ref } from 'vue'

// This will trigger vue-no-nested-reactivity ESLint error
export function useNestedReactive() {
  const state = reactive({
    count: ref(0), // ref inside reactive
    user: {
      name: ref('John'), // nested ref
      age: ref(25),
    },
    settings: reactive({ // reactive inside reactive
      theme: 'dark',
    }),
  })

  return state
}

export function useRefWithReactive() {
  const data = ref(reactive({ // reactive inside ref
    items: [] as string[],
    loading: false,
  }))

  return data
}

export function useDoubleNested() {
  const complex = reactive({
    level1: {
      level2: ref({ // ref deep in reactive
        value: 'nested',
      }),
    },
  })

  return complex
}
