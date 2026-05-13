import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run } from './_test'
import rule, { RULE_NAME } from './prefer-node-style-text'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // No ANSI escapes
    $`
      const msg = 'hello world'
    `,
    // Already using styleText
    $`
      import { styleText } from 'node:util'
      const msg = styleText('yellow', 'warn')
    `,
    // String containing bracketed digits without ESC prefix
    $`
      const msg = '[33m is a marker'
    `,
  ],
  invalid: [
    // Simple wrap with single color, no existing import
    {
      code: $`
        const msg = '\\x1B[33mwarn\\x1B[0m'
      `,
      errors: [{ messageId: 'preferStyleText' }],
      output: $`
        import { styleText } from 'node:util'
        const msg = styleText('yellow', 'warn')
      `,
    },
    // Existing node:util import without styleText
    {
      code: $`
        import { inspect } from 'node:util'
        const msg = '\\x1B[31merror\\x1B[0m'
      `,
      errors: [{ messageId: 'preferStyleText' }],
      output: $`
        import { inspect, styleText } from 'node:util'
        const msg = styleText('red', 'error')
      `,
    },
    // Existing styleText import is reused
    {
      code: $`
        import { styleText } from 'node:util'
        const msg = '\\x1B[32mok\\x1B[0m'
      `,
      errors: [{ messageId: 'preferStyleText' }],
      output: $`
        import { styleText } from 'node:util'
        const msg = styleText('green', 'ok')
      `,
    },
    // Template literal with expression
    {
      code: $`
        import { styleText } from 'node:util'
        const msg = \`\\x1B[33m\${count} outdated\\x1B[0m\`
      `,
      errors: [{ messageId: 'preferStyleText' }],
      output: $`
        import { styleText } from 'node:util'
        const msg = styleText('yellow', \`\${count} outdated\`)
      `,
    },
    // Multi-code SGR (bold + red)
    {
      code: $`
        import { styleText } from 'node:util'
        const msg = '\\x1B[1;31mbold red\\x1B[0m'
      `,
      errors: [{ messageId: 'preferStyleText' }],
      output: $`
        import { styleText } from 'node:util'
        const msg = styleText(['bold', 'red'], 'bold red')
      `,
    },
    // Detected but not auto-fixable (no surrounding reset)
    {
      code: $`
        const msg = '\\x1B[33mwarn without reset'
      `,
      errors: [{ messageId: 'preferStyleText' }],
      output: null,
    },
  ],
})
