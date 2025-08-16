import { computed, ref } from 'vue'

// This should trigger the rule - function starts with "use" but doesn't use reactivity
function useNoReactivity() {
  return {
    data: 'static data',
  }
}

// This should NOT trigger the rule - uses ref
function useWithRef() {
  const count = ref(0)
  return { count }
}

// This should NOT trigger the rule - uses computed
function useWithComputed() {
  const doubled = computed(() => 2 * 2)
  return { doubled }
}

// This should NOT trigger the rule - calls another composable
function useCallsOtherComposable() {
  const result = useWithRef()
  return result
}

// This should NOT trigger the rule - doesn't start with "use"
function regularFunction() {
  return 'not a composable'
}

function usefulFunction() {
  return 'foo'
}
