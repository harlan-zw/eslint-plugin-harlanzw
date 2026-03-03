import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Detect empty sections with no content between headings' },
    schema: [],
    messages: {
      empty: 'Section "{{heading}}" has no content before the next heading.',
    },
  },
  create(context: any) {
    return {
      document(_node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)
        const frontmatterEnd = getFrontmatterEnd(lines)

        const headings: { text: string, line: number }[] = []

        for (let i = 0; i < lines.length; i++) {
          if (shouldSkipLine(i, codeBlockLines, frontmatterEnd))
            continue

          const match = lines[i].match(/^(#{1,6}) (.+)$/)
          if (match)
            headings.push({ text: match[2].trim(), line: i })
        }

        for (let h = 0; h < headings.length - 1; h++) {
          const current = headings[h]
          const next = headings[h + 1]

          let hasContent = false
          for (let i = current.line + 1; i < next.line; i++) {
            // Skip frontmatter but NOT code blocks — code blocks are content
            if (i < frontmatterEnd)
              continue
            if (lines[i].trim().length > 0) {
              hasContent = true
              break
            }
          }

          if (!hasContent) {
            context.report({
              loc: {
                start: { line: current.line + 1, column: 1 },
                end: { line: current.line + 1, column: lines[current.line].length + 1 },
              },
              messageId: 'empty',
              data: { heading: current.text },
            })
          }
        }
      },
    }
  },
}
