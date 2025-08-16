import { computed, reactive, ref, shallowRef } from 'vue'

export function createMyState() {
  const shallow = shallowRef('foo')
  const computedValue = computed(() => 'hello world')
  const bar = ref('bar')
  const reactiveRefs = reactive({
    foo: ref('bar'), // ref inside reactive not allowed
    bar, // ref inside reactive allowed
    computedValue, // computed inside reactive not allowed
    shallow, // shallowRef inside reactive not allowed
  })
  const refsWithReactive = ref({
    baz: reactive({ qux: 'quux' }), // reactive inside ref allowed
    computedValue, // computed inside ref not allowed
    shallow, // shallowRef inside ref not allowed
  })
  const comptedWithReactive = computed(() => ({
    foo: reactive({ bar: 'baz' }), // reactive inside computed allowed
    bar: ref('qux'), // ref inside computed not allowed
  }))
  return {
    reactiveRefs,
    refsWithReactive,
  }
}

export function createMyComputedState() {
  const foo = ref('foo')
  return computed(() => ({
    foo, // invalid
    bar: ref('bar'), // invalid
  }))
}
