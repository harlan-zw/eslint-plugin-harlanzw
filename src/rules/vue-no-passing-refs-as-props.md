# vue-no-passing-refs-as-props

Don't pass refs as props - unwrap them first.

When you pass a ref to a component, pass the actual value, not the ref wrapper.

## Wrong

```ts
const message = ref('Hello')
const template = html`<MyComponent :message="${message}" />`  // passes ref object
```

## Right

```ts
const message = ref('Hello')
const template = html`<MyComponent :message="${message.value}" />`  // passes string

// Or use reactive() instead
const state = reactive({ message: 'Hello' })
const template = html`<MyComponent :message="${state.message}" />`
```

Components expect values, not ref wrappers. Always use `.value` when passing refs as props.
