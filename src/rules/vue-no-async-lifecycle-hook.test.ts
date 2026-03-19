import { run } from './_test'
import rule, { RULE_NAME } from './vue-no-async-lifecycle-hook'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // Sync callback — fine
    `onBeforeUnmount(() => {
      map.value?.unbindAll()
      map.value = undefined
    })`,
    // Sync onMounted
    `onMounted(() => {
      initMap()
    })`,
    // Non-lifecycle async function
    `someOtherFunction(async () => {
      await cleanup()
    })`,
    // Named function ref (not inline async)
    `onBeforeUnmount(cleanupFn)`,
    // onServerPrefetch is designed for async
    `onServerPrefetch(async () => {
      await fetchData()
    })`,
    // Sync function expression
    `onMounted(function () {
      initMap()
    })`,
    // No arguments
    `onMounted()`,
    // .then inside sync callback is fine
    `onMounted(() => {
      loadData().then(initChart).catch(handleError)
    })`,
  ],
  invalid: [
    // async arrow in onBeforeUnmount
    {
      code: `onBeforeUnmount(async () => {
        await Promise.all(cleanupMarkers())
        map.value = undefined
      })`,
      errors: [{ messageId: 'noAsyncLifecycleHook' }],
    },
    // async arrow in onUnmounted
    {
      code: `onUnmounted(async () => {
        await cleanup()
      })`,
      errors: [{ messageId: 'noAsyncLifecycleHook' }],
    },
    // async arrow in onMounted
    {
      code: `onMounted(async () => {
        await loadData()
        initChart()
      })`,
      errors: [{ messageId: 'noAsyncLifecycleHook' }],
    },
    // async function expression
    {
      code: `onBeforeUnmount(async function () {
        await teardown()
      })`,
      errors: [{ messageId: 'noAsyncLifecycleHook' }],
    },
    // onBeforeMount async
    {
      code: `onBeforeMount(async () => {
        await prepare()
      })`,
      errors: [{ messageId: 'noAsyncLifecycleHook' }],
    },
    // onUpdated async
    {
      code: `onUpdated(async () => {
        await syncState()
      })`,
      errors: [{ messageId: 'noAsyncLifecycleHook' }],
    },
    // onActivated async
    {
      code: `onActivated(async () => {
        await rehydrate()
      })`,
      errors: [{ messageId: 'noAsyncLifecycleHook' }],
    },
    // onDeactivated async
    {
      code: `onDeactivated(async () => {
        await saveState()
      })`,
      errors: [{ messageId: 'noAsyncLifecycleHook' }],
    },
    // onErrorCaptured async
    {
      code: `onErrorCaptured(async () => {
        await reportError()
      })`,
      errors: [{ messageId: 'noAsyncLifecycleHook' }],
    },
  ],
})
