import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

const REGEX_1 = /(\s+)$/

export default {
  meta: {
    type: 'layout' as const,
    docs: { description: 'Disallow trailing whitespace in prompt files' },
    fixable: 'whitespace' as const,
    schema: [],
    messages: {
      trailing: 'Trailing whitespace.',
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
          const match = line.match(REGEX_1)
          if (match) {
            const trailingStart = line.length - match[1].length
            const lineNode = node.children[i]
            const startOffset = lineNode.position.start.offset + trailingStart
            const endOffset = lineNode.position.start.offset + line.length

            context.report({
              loc: {
                start: { line: i + 1, column: trailingStart + 1 },
                end: { line: i + 1, column: line.length + 1 },
              },
              messageId: 'trailing',
              fix(fixer: any) {
                return fixer.removeRange([startOffset, endOffset])
              },
            })
          }
        }
      },
    }
  },
}
