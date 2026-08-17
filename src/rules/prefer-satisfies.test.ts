import type { Linter } from 'eslint'
import { unindent as $ } from 'eslint-vitest-rule-tester'
import { run } from './_test'
import rule, { RULE_NAME } from './prefer-satisfies'

/** Applies a report's single suggestion to `code` so the rewrite can be asserted. */
function applySuggestion(code: string, message: Linter.LintMessage): string {
  const [suggestion] = message.suggestions ?? []
  if (!suggestion)
    throw new Error(`expected a suggestion, got none`)
  const [start, end] = suggestion.fix.range
  return code.slice(0, start) + suggestion.fix.text + code.slice(end)
}

run({
  name: RULE_NAME,
  rule,
  valid: [
    // already using satisfies
    $`
      const handlers = {
        start: startHandler,
      } satisfies Record<string, Handler>
    `,
    // no annotation at all
    $`
      const handlers = {
        start: startHandler,
      }
    `,
    // finite key union: the annotation buys exhaustiveness checking
    $`
      const labels: Record<Status, string> = {
        idle: 'Idle',
        busy: 'Busy',
      }
    `,
    // string literal union key
    $`
      const configs: Record<'recommended' | 'migration', Config> = {
        recommended: a,
        migration: b,
      }
    `,
    // opaque value type: no evidence worth preserving
    $`
      const payload: Record<string, unknown> = {
        id: 1,
      }
    `,
    $`
      const options: Record<string, any> = {
        depth: 1,
      }
    `,
    // empty literal is a mutable-map seed
    $`
      const cache: Record<string, Entry> = {}
    `,
    // written to via index assignment
    $`
      const counts: Record<string, number> = {
        total: 0,
      }
      counts[key] = 1
    `,
    // written to via member assignment
    $`
      const query: Record<string, string> = {
        page: '1',
      }
      query.limit = '10'
    `,
    // deleted from
    $`
      const query: Record<string, string> = {
        page: '1',
      }
      delete query.page
    `,
    // incremented
    $`
      const counts: Record<string, number> = {
        total: 0,
      }
      counts.total++
    `,
    // Object.assign target
    $`
      const query: Record<string, string> = {
        page: '1',
      }
      Object.assign(query, extra)
    `,
    // spread means the key set is not statically known
    $`
      const merged: Record<string, string> = {
        ...base,
        page: '1',
      }
    `,
    // let is reassignable
    $`
      let handlers: Record<string, Handler> = {
        start: startHandler,
      }
    `,
    // not an object literal
    $`
      const handlers: Record<string, Handler> = buildHandlers()
    `,
    // a named interface is not a widening annotation
    $`
      const config: AppConfig = {
        mode: 'strict',
      }
    `,
  ],
  invalid: [
    // Record<string, V>
    {
      code: $`
        const handlers: Record<string, Handler> = {
          start: startHandler,
        }
      `,
      errors: (messages) => {
        expect(messages).toHaveLength(1)
        expect(messages[0].messageId).toBe('preferSatisfies')
        expect(applySuggestion($`
          const handlers: Record<string, Handler> = {
            start: startHandler,
          }
        `, messages[0])).toBe($`
          const handlers = {
            start: startHandler,
          } satisfies Record<string, Handler>
        `)
      },
    },
    // Record<number, V>
    {
      code: $`
        const products: Record<number, Product> = {
          1: widget,
        }
      `,
      errors: [{ messageId: 'preferSatisfies' }],
    },
    // index signature
    {
      code: $`
        const entities: { [key: string]: string } = {
          amp: '&',
        }
      `,
      errors: (messages) => {
        expect(messages).toHaveLength(1)
        expect(applySuggestion($`
          const entities: { [key: string]: string } = {
            amp: '&',
          }
        `, messages[0])).toBe($`
          const entities = {
            amp: '&',
          } satisfies { [key: string]: string }
        `)
      },
    },
    // Readonly<Record<string, V>>
    {
      code: $`
        const TITLES: Readonly<Record<string, string>> = {
          seo: 'SEO',
        }
      `,
      errors: [{ messageId: 'preferSatisfies' }],
    },
    // exported constant
    {
      code: $`
        export const FIX_HINTS: Record<string, string> = {
          'no-silent-catch': 'Handle the error.',
        }
      `,
      errors: [{ messageId: 'preferSatisfies' }],
    },
    // structured value type
    {
      code: $`
        const iconRelLabels: Record<string, { label: string, description: string }> = {
          icon: { label: 'Icon', description: 'Favicon' },
        }
      `,
      errors: [{ messageId: 'preferSatisfies' }],
    },
    // read-only usage elsewhere does not exempt it
    {
      code: $`
        const labels: Record<string, string> = {
          start: 'Start',
        }
        export function label(key: string) {
          return labels[key]
        }
      `,
      errors: [{ messageId: 'preferSatisfies' }],
    },
  ],
})
