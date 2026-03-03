import type { DocumentNode } from '../types'
import { getFrontmatterEnd } from '../utils'

export default {
  meta: {
    type: 'problem' as const,
    docs: { description: 'Detect unclosed code fences' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      unclosed: 'Code fence opened on line {{line}} is never closed. Everything after it is treated as code.',
    },
  },
  create(context: any) {
    return {
      document(node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const frontmatterEnd = getFrontmatterEnd(lines)

        let openFenceLine = -1

        for (let i = frontmatterEnd; i < lines.length; i++) {
          if (lines[i].trimStart().startsWith('```')) {
            if (openFenceLine === -1) {
              openFenceLine = i
            }
            else {
              openFenceLine = -1
            }
          }
        }

        if (openFenceLine !== -1) {
          context.report({
            loc: {
              start: { line: openFenceLine + 1, column: 1 },
              end: { line: openFenceLine + 1, column: lines[openFenceLine].length + 1 },
            },
            messageId: 'unclosed',
            data: { line: String(openFenceLine + 1) },
            fix(fixer: any) {
              const docEnd = node.position.end.offset
              return fixer.insertTextAfterRange([docEnd, docEnd], '\n```')
            },
          })
        }
      },
    }
  },
}
