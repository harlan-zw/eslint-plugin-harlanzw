import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run } from './_test'
import rule, { RULE_NAME } from './no-test-file-reads'

run({
  name: RULE_NAME,
  rule,
  valid: [
    {
      filename: 'example.test.ts',
      code: $`
        import { writeFileSync } from 'node:fs'
        writeFileSync('result.txt', 'done')
      `,
    },
    {
      filename: 'example.test.ts',
      code: $`
        import { readFile } from './fixture-reader'
        readFile('fixture.txt')
      `,
    },
    {
      filename: 'example.test.ts',
      code: $`
        import * as fs from 'node:fs'
        fs.existsSync('fixture.txt')
      `,
    },
    {
      filename: 'example.test.ts',
      code: $`
        import { readFileSync } from 'node:fs'

        function load(readFileSync: () => string) {
          return readFileSync()
        }
      `,
    },
    {
      filename: 'example.test.ts',
      code: $`
        import { readFile } from 'node:fs/promises'
        import { join } from 'node:path'

        const outputDir = '/tmp/output'
        const pages = JSON.parse(await readFile(join(outputDir, 'pages.json'), 'utf8'))
        const markdown = await readFile(join(outputDir, \`content\${route}.md\`), 'utf8')
      `,
    },
    {
      filename: 'example.test.ts',
      code: $`
        import { readFile } from 'node:fs/promises'
        import { join } from 'node:path'

        const headersPath = join(outputDir, '_headers')
        const headers = await readFile(headersPath, 'utf8')
      `,
    },
    {
      filename: 'example.test.ts',
      code: $`
        import { readFile } from 'node:fs/promises'

        const output = await readFile(getPublicPath('llms.txt'), 'utf8')
      `,
    },
  ],
  invalid: [
    {
      filename: 'example.test.ts',
      code: $`
        import { readFileSync } from 'node:fs'
        const source = readFileSync('src/index.ts', 'utf8')
      `,
      errors: [{ messageId: 'noTestFileRead', data: { name: 'readFileSync' } }],
    },
    {
      filename: 'example.test.ts',
      code: $`
        import { readFile as load } from 'node:fs/promises'
        const source = await load('src/index.ts', 'utf8')
      `,
      errors: [{ messageId: 'noTestFileRead', data: { name: 'readFile' } }],
    },
    {
      filename: 'example.test.ts',
      code: $`
        import * as fs from 'node:fs'
        const source = fs.readFileSync('src/index.ts', 'utf8')
      `,
      errors: [{ messageId: 'noTestFileRead', data: { name: 'readFileSync' } }],
    },
    {
      filename: 'example.test.ts',
      code: $`
        import fs from 'node:fs'
        const source = await fs.promises.readFile('src/index.ts', 'utf8')
      `,
      errors: [{ messageId: 'noTestFileRead', data: { name: 'readFile' } }],
    },
    {
      filename: 'example.test.ts',
      code: $`
        const source = require('node:fs').readFileSync('src/index.ts', 'utf8')
      `,
      errors: [{ messageId: 'noTestFileRead', data: { name: 'readFileSync' } }],
    },
    {
      filename: 'example.test.ts',
      code: $`
        const { readFile: load } = require('fs/promises')
        const source = await load('src/index.ts', 'utf8')
      `,
      errors: [{ messageId: 'noTestFileRead', data: { name: 'readFile' } }],
    },
    {
      filename: 'example.test.ts',
      code: $`
        const fs = await import('node:fs')
        const source = fs.readFileSync('src/index.ts', 'utf8')
      `,
      errors: [{ messageId: 'noTestFileRead', data: { name: 'readFileSync' } }],
    },
    {
      filename: 'example.test.ts',
      code: $`
        const source = await import('node:fs').then(fs =>
          fs.readFileSync('src/index.ts', 'utf8'))
      `,
      errors: [{ messageId: 'noTestFileRead', data: { name: 'readFileSync' } }],
    },
    {
      filename: 'example.test.ts',
      code: $`
        const source = (await import('node:fs/promises')).readFile('src/index.ts', 'utf8')
      `,
      errors: [{ messageId: 'noTestFileRead', data: { name: 'readFile' } }],
    },
    {
      filename: 'example.test.ts',
      code: $`
        const source = readFileSync('src/index.ts', 'utf8')
        import { readFileSync } from 'node:fs'
      `,
      errors: [{ messageId: 'noTestFileRead', data: { name: 'readFileSync' } }],
    },
    {
      filename: 'example.test.ts',
      code: $`
        import * as fs from 'node:fs'
        const { readFileSync: load } = fs
        const source = load('src/index.ts', 'utf8')
      `,
      errors: [{ messageId: 'noTestFileRead', data: { name: 'readFileSync' } }],
    },
    {
      filename: 'example.test.ts',
      code: $`
        import { readFile } from 'node:fs/promises'
        const source = await readFile(resolvePath('Component.vue'), 'utf8')
      `,
      errors: [{ messageId: 'noTestFileRead', data: { name: 'readFile' } }],
    },
    {
      filename: 'example.test.ts',
      code: $`
        import { readFile } from 'node:fs/promises'
        import { join } from 'node:path'

        const sourcePath = join(root, 'src/index.ts')
        const source = await readFile(sourcePath, 'utf8')
      `,
      errors: [{ messageId: 'noTestFileRead', data: { name: 'readFile' } }],
    },
    {
      filename: 'example.test.ts',
      code: $`
        import { readFile } from 'node:fs/promises'
        const source = await readFile(filename, 'utf8')
      `,
      errors: [{ messageId: 'noTestFileRead', data: { name: 'readFile' } }],
    },
  ],
})
