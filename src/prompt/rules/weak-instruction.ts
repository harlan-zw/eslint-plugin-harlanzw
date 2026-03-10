import type { DocumentNode } from '../types'
import { STRENGTH_PATTERNS, WEAK_TO_STRONG } from '../constants'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

const REGEX_1 = /[.*+?^${}()|[\]\\]/g

// Pre-compile regexes at module level
const COMPILED = STRENGTH_PATTERNS.weak.map((pattern) => {
  const escaped = pattern.replace(REGEX_1, '\\$&')
  return new RegExp(`\\b${escaped}\\b`, 'gi')
})

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Disallow weak instruction language that models may interpret inconsistently' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      weak: 'Weak instruction: "{{found}}". Use "{{suggestion}}" for more consistent behavior.',
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
          for (let wi = 0; wi < COMPILED.length; wi++) {
            const regex = COMPILED[wi]
            regex.lastIndex = 0
            let match: RegExpExecArray | null
            while ((match = regex.exec(line)) !== null) {
              const suggestion = WEAK_TO_STRONG[match[0].toLowerCase()] ?? 'Must'
              const lineNode = node.children[i]
              const startOffset = lineNode.position.start.offset + match.index
              const endOffset = startOffset + match[0].length

              context.report({
                loc: {
                  start: { line: i + 1, column: match.index + 1 },
                  end: { line: i + 1, column: match.index + match[0].length + 1 },
                },
                messageId: 'weak',
                data: { found: match[0], suggestion },
                fix(fixer: any) {
                  return fixer.replaceTextRange([startOffset, endOffset], suggestion)
                },
              })
            }
          }
        }
      },
    }
  },
}
