import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, isInScope, parseLineScopes, shouldSkipLine } from '../utils'

// Weak expletive constructions at sentence start
const WEAK_OPENERS = [
  'there is',
  'there are',
  'there was',
  'there were',
  'there will be',
  'there has been',
  'there have been',
  'it is important to',
  'it is necessary to',
  'it is possible to',
  'it is recommended to',
  'it is worth',
  'it is common to',
  'it is useful to',
  'it is helpful to',
  'it is easy to',
  'it is difficult to',
  'it is also',
  'it can be',
]

// Sort longest-first
const SORTED_OPENERS = [...WEAK_OPENERS].sort((a, b) => b.length - a.length)

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Flag weak sentence openers that pad without adding meaning' },
    schema: [],
    messages: {
      weakOpener: 'Weak opener: "{{found}}". Rewrite to lead with the subject or action.',
    },
  },
  create(context: any) {
    return {
      document(_node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)
        const frontmatterEnd = getFrontmatterEnd(lines)

        for (let i = 0; i < lines.length; i++) {
          if (shouldSkipLine(i, codeBlockLines, frontmatterEnd))
            continue

          const line = lines[i]
          const scopes = parseLineScopes(line)
          // Strip leading markdown (list markers, heading markers)
          const stripped = line.replace(/^(?:[#>*+-]|\d+\.)\s+/, '')
          const offset = line.length - stripped.length

          for (const opener of SORTED_OPENERS) {
            if (stripped.toLowerCase().startsWith(opener)) {
              // Ensure it's followed by a word boundary (space or end)
              const nextChar = stripped[opener.length]
              if (nextChar && nextChar !== ' ')
                continue

              const matchStart = offset
              const matchEnd = offset + opener.length

              if (isInScope(scopes, matchStart, matchEnd, ['code', 'link-url']))
                continue

              context.report({
                loc: {
                  start: { line: i + 1, column: matchStart + 1 },
                  end: { line: i + 1, column: matchEnd + 1 },
                },
                messageId: 'weakOpener',
                data: { found: stripped.slice(0, opener.length) },
              })
              break // Only report first match per line
            }
          }
        }
      },
    }
  },
}
