import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, isInScope, parseLineScopes, shouldSkipLine } from '../utils'

// Matches: "it's not X — it's Y", "it's not X, it's Y", "it's not X; it's Y"
// Case-insensitive, requires distinct words after each "it's not" and "it's"
const APOSTROPHE = `(?:'|\u2019)`
const PATTERN = new RegExp(`\\b(?:it${APOSTROPHE}s|it is|is|are)\\s+not\\b.+?\\b(?:it${APOSTROPHE}s|it is|is|are)\\b|\\bis\\s+no\\s+longer\\s+just\\s+about\\b.+?\\bit${APOSTROPHE}s\\s+about\\b`, 'i')

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Flag "it\'s not X — it\'s Y" contrast patterns common in AI-generated content' },
    schema: [],
    messages: {
      falseDichotomy: '"It\'s not X — it\'s Y" is a common AI writing pattern. Rewrite to state the point directly.',
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
          const match = PATTERN.exec(line)

          if (!match)
            continue

          const matchStart = match.index
          const matchEnd = matchStart + match[0].length

          if (isInScope(scopes, matchStart, matchEnd, ['code', 'link-url']))
            continue

          context.report({
            loc: {
              start: { line: i + 1, column: matchStart + 1 },
              end: { line: i + 1, column: matchEnd + 1 },
            },
            messageId: 'falseDichotomy',
          })
        }
      },
    }
  },
}
