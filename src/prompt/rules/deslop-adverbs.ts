import type { DocumentNode } from '../types'
import { UNNECESSARY_ADVERBS } from '../deslop-constants'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

// Pre-compile regexes at module level
const COMPILED = UNNECESSARY_ADVERBS.map((adverb) => {
  return { regex: new RegExp(`\\b${adverb}\\s+`, 'gi'), adverb }
})

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Remove unnecessary adverbs that add no meaning' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      adverb: 'Unnecessary adverb: "{{found}}". Remove it.',
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

          for (const { regex, adverb } of COMPILED) {
            regex.lastIndex = 0
            let match: RegExpExecArray | null
            while ((match = regex.exec(line)) !== null) {
              const startOffset = lineNode.position.start.offset + match.index
              const endOffset = startOffset + match[0].length

              context.report({
                loc: {
                  start: { line: i + 1, column: match.index + 1 },
                  end: { line: i + 1, column: match.index + match[0].length + 1 },
                },
                messageId: 'adverb',
                data: { found: adverb },
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
