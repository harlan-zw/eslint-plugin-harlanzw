import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Detect duplicate markdown headings' },
    schema: [],
    messages: {
      duplicate: 'Duplicate heading "{{heading}}". Identical headings make section references ambiguous.',
    },
  },
  create(context: any) {
    return {
      document(_node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)
        const frontmatterEnd = getFrontmatterEnd(lines)

        const seen = new Map<string, number>()

        for (let i = 0; i < lines.length; i++) {
          if (shouldSkipLine(i, codeBlockLines, frontmatterEnd))
            continue

          const match = lines[i].match(/^(#{1,6}) (.+)$/)
          if (!match)
            continue

          const heading = match[2].trim().toLowerCase()
          if (seen.has(heading)) {
            context.report({
              loc: {
                start: { line: i + 1, column: 1 },
                end: { line: i + 1, column: lines[i].length + 1 },
              },
              messageId: 'duplicate',
              data: { heading: match[2].trim() },
            })
          }
          else {
            seen.set(heading, i)
          }
        }
      },
    }
  },
}
