# prefer-satisfies

Prefer `satisfies` over a widening type annotation on object literals.

## Rule Details

A `Record<string, V>` annotation tells TypeScript the object may hold any string key. The compiler then forgets which keys the literal actually declared:

```ts
const handlers: Record<string, Handler> = {
  start: startHandler,
}

handlers.strat        // Handler. Compiles. undefined at runtime.
keyof typeof handlers // string
```

`satisfies` checks the same constraint but keeps the literal type:

```ts
const handlers = {
  start: startHandler,
} satisfies Record<string, Handler>

handlers.strat        // Property 'strat' does not exist.
keyof typeof handlers // 'start'
```

You keep key autocomplete, exhaustive switches over `keyof typeof`, and a correct `Object.keys` result. Assignability and excess property checks still run, and inline arrow parameters still get contextual types.

The rule reports a suggestion, not an autofix. Narrowing the type can surface real errors at other call sites, so each rewrite needs a look.

## When the rule fires

The annotation must erase a known key set, and the object must be safe to freeze:

- the declaration is `const`
- the annotation is `Record<string, V>`, `Record<number, V>`, `{ [key: string]: V }`, or one of those wrapped in `Readonly` or `Partial`
- the value type `V` is not `any` or `unknown`
- the initialiser is a non-empty object literal with no spread elements
- the variable is never written to afterwards
- the variable is never read with a computed non-literal key

## Examples

Incorrect:

```ts
const HANDLERS: Record<string, Handler> = {
  start: startHandler,
  stop: stopHandler,
}

const products: Record<number, Product> = {
  1: widget,
}

const TITLES: Readonly<Record<string, string>> = {
  seo: 'SEO',
}
```

Correct:

```ts
const HANDLERS = {
  start: startHandler,
  stop: stopHandler,
} satisfies Record<string, Handler>
```

## When Not To Use It

The rule already skips the cases below, but they explain why it stays narrow.

A finite key union is not widening. The annotation forces you to cover every member, which `satisfies` cannot do:

```ts
const labels: Record<Status, string> = {
  idle: 'Idle',
  busy: 'Busy',
}
```

A mutable map needs the open key type, because `satisfies` would reject any new key:

```ts
const counts: Record<string, number> = { total: 0 }
counts[key] = 1
```

A lookup map read by a computed key needs the open key type. Narrowing it makes every
read an implicit `any`, so `satisfies` would trade this warning for a type error:

```ts
const XML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
}

export function decode(name: string) {
  return XML_ENTITIES[name]
}
```

A literal key names one member, so it does not exempt the map. `XML_ENTITIES['amp']`
is still reported.

A bag of `unknown` or `any` values carries no evidence worth preserving:

```ts
const payload: Record<string, unknown> = { id: 1 }
```
