import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, isInScope, parseLineScopes, shouldSkipLine } from '../utils'

const REGEX_1 = /\u2014/g

// Find all em dash positions on a line (excluding scoped regions)
function findEmDashes(line: string, scopes: ReturnType<typeof parseLineScopes>): number[] {
  const positions: number[] = []
  const regex = REGEX_1
  let match: RegExpExecArray | null
  while ((match = regex.exec(line)) !== null) {
    if (!isInScope(scopes, match.index, match.index + 1, ['code', 'link-url']))
      positions.push(match.index)
  }
  return positions
}

// Check if text before the em dash looks like a label/title:
// **bold**, ### heading, or list item prefix (- **bold**)
const LABEL_BEFORE = /(?:\*\*[^*]+\*\*|#{1,6}\s+\S(?:.*\S)?)\s*$/

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Flag em dashes so sentences can be rewritten without them' },
    schema: [],
    messages: {
      emDash: 'Rewrite this sentence to avoid using an em dash as a separator. Use two sentences, a semicolon, or restructure with commas.',
    },
  },
  create(context: any) {
    return {
      document(node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)
        const frontmatterEnd = getFrontmatterEnd(lines)

        for (let i = 0; i < lines.length; i++) {
          if (shouldSkipLine(i, codeBlockLines, frontmatterEnd))
            continue

          const line = lines[i]
          const scopes = parseLineScopes(line)
          const positions = findEmDashes(line, scopes)

          for (const pos of positions) {
            context.report({
              loc: {
                start: { line: i + 1, column: pos + 1 },
                end: { line: i + 1, column: pos + 2 },
              },
              messageId: 'emDash',
            })
          }
        }
      },
    }
  },
}
