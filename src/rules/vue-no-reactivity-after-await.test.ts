import { run } from './_test'
import rule, { RULE_NAME } from './vue-no-reactivity-after-await'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Sync setup scope — Vue auto-stops
    `watch(() => props.options, handler, { deep: true })`,
    // watch before await in async function
    `async function setup() {
      watch(() => props.options, handler)
      await fetchData()
    }`,
    // watch in sync callback of whenever
    `whenever(() => mapReady.value, () => {
      watch(() => props.options, handler, { deep: true })
    })`,
    // watch in non-async function
    `function useMyComposable() {
      watch(() => props.options, handler)
    }`,
    // await inside a nested function doesn't count
    `async function setup() {
      const cb = async () => { await fetchData() }
      watch(() => props.options, handler)
    }`,
    // computed at top level
    `const doubled = computed(() => count.value * 2)`,
    // watchEffect before await
    `async function setup() {
      watchEffect(() => console.log(count.value))
      await loadData()
    }`,
    // ref/reactive after await is fine (not subscription APIs)
    `async function setup() {
      await loadData()
      const count = ref(0)
      const state = reactive({ foo: 'bar' })
    }`,
    // watch in if block before await
    `async function setup() {
      if (condition) {
        watch(() => x.value, handler)
      }
      await loadData()
    }`,
    // VueUse watch variants before await
    `async function setup() {
      watchDebounced(() => x.value, handler, { debounce: 500 })
      await loadData()
    }`,
  ],
  invalid: [
    // watch after await in async arrow
    {
      code: `const setup = async () => {
        await importLibrary('marker')
        watch(() => props.options, handler, { deep: true })
      }`,
      errors: [{ messageId: 'noReactivityAfterAwait' }],
    },
    // whenever after await
    {
      code: `const setup = async () => {
        await importLibrary('marker')
        whenever(() => props.options, handler)
      }`,
      errors: [{ messageId: 'noReactivityAfterAwait' }],
    },
    // watchEffect after await
    {
      code: `async function setup() {
        await fetchData()
        watchEffect(() => console.log(count.value))
      }`,
      errors: [{ messageId: 'noReactivityAfterAwait' }],
    },
    // computed after await
    {
      code: `async function setup() {
        await fetchData()
        const doubled = computed(() => count.value * 2)
      }`,
      errors: [{ messageId: 'noReactivityAfterAwait' }],
    },
    // watch after await inside async callback
    {
      code: `whenever(() => mapReady.value, async () => {
        await importLibrary('marker')
        watch(() => props.options, handler, { deep: true })
      })`,
      errors: [{ messageId: 'noReactivityAfterAwait' }],
    },
    // Multiple violations
    {
      code: `async function setup() {
        await fetchData()
        watch(() => a.value, handler)
        watchEffect(() => console.log(b.value))
      }`,
      errors: [
        { messageId: 'noReactivityAfterAwait' },
        { messageId: 'noReactivityAfterAwait' },
      ],
    },
    // watchSyncEffect after await
    {
      code: `async function setup() {
        await fetchData()
        watchSyncEffect(() => console.log(count.value))
      }`,
      errors: [{ messageId: 'noReactivityAfterAwait' }],
    },
    // watchPostEffect after await
    {
      code: `async function setup() {
        await fetchData()
        watchPostEffect(() => console.log(count.value))
      }`,
      errors: [{ messageId: 'noReactivityAfterAwait' }],
    },
    // VueUse watchDebounced after await
    {
      code: `async function setup() {
        await fetchData()
        watchDebounced(() => x.value, handler, { debounce: 500 })
      }`,
      errors: [{ messageId: 'noReactivityAfterAwait' }],
    },
    // watch inside if block after await
    {
      code: `async function setup() {
        await fetchData()
        if (condition) {
          watch(() => x.value, handler)
        }
      }`,
      errors: [{ messageId: 'noReactivityAfterAwait' }],
    },
    // computedAsync after await
    {
      code: `async function setup() {
        await fetchData()
        const result = computedAsync(() => fetchMore())
      }`,
      errors: [{ messageId: 'noReactivityAfterAwait' }],
    },
  ],
})
