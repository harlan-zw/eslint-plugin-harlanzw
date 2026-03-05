import type { DocumentNode } from '../types'
import { HEDGING_WORDS } from '../deslop-constants'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Remove hedging and qualifying words that weaken copy' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      hedging: 'Hedging word: "{{found}}". Remove it for more confident copy.',
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
          const lineNode = node.children[i]

          for (const word of HEDGING_WORDS) {
            const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const regex = new RegExp(`\\b${escaped}\\s+`, 'gi')
            let match: RegExpExecArray | null
            while ((match = regex.exec(line)) !== null) {
              const startOffset = lineNode.position.start.offset + match.index
              const endOffset = startOffset + match[0].length

              context.report({
                loc: {
                  start: { line: i + 1, column: match.index + 1 },
                  end: { line: i + 1, column: match.index + match[0].length + 1 },
                },
                messageId: 'hedging',
                data: { found: word },
                fix(fixer: any) {
                  return fixer.replaceTextRange([startOffset, endOffset], '')
                },
              })
            }
          }
        }
      },
    }
  },
}
