import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run } from './_test'
import rule, { RULE_NAME } from './no-silent-catch'

run({
  name: RULE_NAME,
  rule,
  valid: [
    // .catch with actual error handling
    $`
      await fetch('/api').catch(e => console.error(e))
    `,
    // .catch with error logging
    $`
      promise.catch(err => {
        logger.warn('Request failed', err)
      })
    `,
    // .catch with a named function
    $`
      promise.catch(handleError)
    `,
    // try/catch with handling
    $`
      try {
        await doSomething()
      } catch (e) {
        console.error(e)
      }
    `,
    // try/catch with comment explaining why empty is ok
    $`
      try {
        await doSomething()
      } catch (e) {
        // expected: file may not exist
      }
    `,
    // Regular .catch on non-promise (just the word catch as method)
    $`
      obj.catch(data => processData(data))
    `,
    // .catch that returns something
    $`
      promise.catch(() => fallbackValue)
    `,
    // .catch arrow returning a call
    $`
      promise.catch(() => getDefault())
    `,
    // No catch at all
    $`
      await doSomething()
    `,
  ],
  invalid: [
    // .catch(() => {})
    {
      code: $`
        await suggestPrepareHook(cwd).catch(() => {})
      `,
      errors: [{ messageId: 'noSilentCatch' }],
    },
    // .catch(e => {})
    {
      code: $`
        promise.catch(e => {})
      `,
      errors: [{ messageId: 'noSilentCatch' }],
    },
    // .catch(function() {})
    {
      code: $`
        promise.catch(function() {})
      `,
      errors: [{ messageId: 'noSilentCatch' }],
    },
    // .catch(function(err) {})
    {
      code: $`
        promise.catch(function(err) {})
      `,
      errors: [{ messageId: 'noSilentCatch' }],
    },
    // .catch(() => undefined)
    {
      code: $`
        promise.catch(() => undefined)
      `,
      errors: [{ messageId: 'noSilentCatch' }],
    },
    // .catch(() => void 0)
    {
      code: $`
        promise.catch(() => void 0)
      `,
      errors: [{ messageId: 'noSilentCatch' }],
    },
    // try/catch with empty block
    {
      code: $`
        try {
          await doSomething()
        } catch (e) {}
      `,
      errors: [{ messageId: 'noSilentTryCatch' }],
    },
    // try/catch with empty block (no param)
    {
      code: $`
        try {
          await doSomething()
        } catch {}
      `,
      errors: [{ messageId: 'noSilentTryCatch' }],
    },
    // Chained .catch(() => {})
    {
      code: $`
        fetch('/api')
          .then(res => res.json())
          .catch(() => {})
      `,
      errors: [{ messageId: 'noSilentCatch' }],
    },
    // Multiple violations
    {
      code: $`
        promise1.catch(() => {})
        promise2.catch(e => {})
      `,
      errors: [
        { messageId: 'noSilentCatch' },
        { messageId: 'noSilentCatch' },
      ],
    },
  ],
})
