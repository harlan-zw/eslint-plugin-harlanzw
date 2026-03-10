import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

const REGEX_1 = /\{\{\s*\}\}/g

export default {
  meta: {
    type: 'problem' as const,
    docs: { description: 'Disallow empty variable placeholders' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      empty: 'Empty variable placeholder \'{{placeholder}}\' detected. Add a variable name or remove it.',
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
          const regex = REGEX_1
          let match: RegExpExecArray | null
          while ((match = regex.exec(line)) !== null) {
            const lineNode = node.children[i]
            const startOffset = lineNode.position.start.offset + match.index
            const endOffset = startOffset + match[0].length

            context.report({
              loc: {
                start: { line: i + 1, column: match.index + 1 },
                end: { line: i + 1, column: match.index + match[0].length + 1 },
              },
              messageId: 'empty',
              data: { placeholder: match[0] },
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
