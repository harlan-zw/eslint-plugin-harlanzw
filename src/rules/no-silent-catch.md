# no-silent-catch

Require error handling or an explanation when code intentionally ignores a failure.

## Reported patterns

The rule reports empty Promise handlers, no-op return values, and empty `catch` blocks:

```ts
request().catch(() => {})
request().catch(() => undefined)
request().catch(() => void 0)
request().catch(() => null)

try {
  await request()
}
catch {}
```

Returning `undefined` or `null` from a block is also reported.

## Handling the error

Log, propagate, or return a real fallback:

```ts
request().catch(error => logger.warn('Request failed', error))
request().catch(() => cachedValue)

try {
  await request()
}
catch (error) {
  reportError(error)
}
```

If ignoring the failure is deliberate, leave a specific comment inside the handler:

```ts
request().catch(() => {
  // Expected: this optional request may fail offline.
})
```

The rule checks syntax and does not require TypeScript type information. It has no options or auto-fix.
