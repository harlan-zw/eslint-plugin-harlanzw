# Disallow file reads in tests

Warn when tests call Node.js `readFile()` or `readFileSync()`.

File text checks often restate implementation details. They can pass while behaviour is broken.

```ts
// Bad
import { readFileSync } from 'node:fs'

const source = readFileSync('src/resolve-path.ts', 'utf8')
expect(source).toContain('export function resolvePath')
```

Call an exported boundary and assert its result.

```ts
// Good
const result = resolvePath('/srv/app', '../../etc/passwd')
expect(result).toEqual({ _tag: 'Err', reason: 'escapes-root' })
```

Disable the warning with a reason when reading a file is part of the public behaviour.

```ts
// The command writes this customer-visible report.
// eslint-disable-next-line harlanzw/no-test-file-reads
const report = await readFile(reportPath, 'utf8')
```
