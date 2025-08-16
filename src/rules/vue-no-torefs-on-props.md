# vue-no-torefs-on-props

Disallow using `toRefs()` on props object in Vue.

Props in Vue are already reactive, making the use of `toRefs()` on props redundant. This rule helps avoid unnecessary code and potential confusion by preventing the use of `toRefs()` on props objects.

## Rule Details

This rule identifies when `toRefs()` is called on variables that were assigned from `defineProps()` and reports it as an error. Since props are already reactive in Vue, destructuring them directly is sufficient and more efficient.

### ❌ Incorrect

```js
import { toRefs } from 'vue'

const props = defineProps<{
  dateRange: DateRange
  userName: string
}>()

// Redundant use of toRefs on props
const { dateRange, userName } = toRefs(props)
```

```js
import { toRefs } from 'vue'

const componentProps = defineProps<{
  value: string
  disabled: boolean
}>()

// Also incorrect with different variable name
const { value, disabled } = toRefs(componentProps)
```

### ✅ Correct

```js
const props = defineProps<{
  dateRange: DateRange
  userName: string
}>()

// Direct destructuring of props (already reactive)
const { dateRange, userName } = props
```

```js
import { reactive, toRefs } from 'vue'

// Using toRefs on non-props reactive objects is fine
const state = reactive({
  count: 0,
  message: 'hello'
})

const { count, message } = toRefs(state)
```

```js
const props = defineProps<{
  initialValue: number
}>()

// Using individual props directly is also fine
const currentValue = ref(props.initialValue)
```

## Why This Rule Exists

1. **Redundancy**: Props are already reactive in Vue 3, so `toRefs()` doesn't add any functionality
2. **Performance**: Avoiding unnecessary `toRefs()` calls can provide minor performance benefits
3. **Clarity**: Direct prop usage makes the code more straightforward and easier to understand
4. **Consistency**: Encourages consistent patterns across the codebase

## Options

This rule has no options.

## When Not To Use It

This rule should generally always be enabled when working with Vue 3. However, you might consider disabling it if:

- You're migrating from Vue 2 and need to maintain compatibility during transition
- You have specific edge cases where the `toRefs()` pattern is intentionally used for props (though this is not recommended)
