# Disallow file reads in tests

Warn when tests read source files or files with unknown paths.

File text checks often restate implementation details. They can pass while behaviour is broken.
Known non-source paths, such as generated `.json`, `.md`, and `.txt` files, are allowed.

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

Disable the warning with a reason when a dynamic path targets generated output.

```ts
// The command writes this customer-visible report.
// eslint-disable-next-line harlanzw/no-test-file-reads
const report = await readFile(reportPath, 'utf8')
```
