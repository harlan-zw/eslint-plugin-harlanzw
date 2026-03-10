import type { DocumentNode } from '../types'
import { AMBIGUOUS_QUANTIFIERS, QUANTIFIER_SUGGESTIONS } from '../constants'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

const REGEX_1 = /[.*+?^${}()|[\]\\]/g

// Pre-compile regexes at module level
const COMPILED = AMBIGUOUS_QUANTIFIERS.map((quantifier) => {
  const escaped = quantifier.replace(REGEX_1, '\\$&')
  return new RegExp(`\\b${escaped}\\b`, 'gi')
})

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Disallow ambiguous quantifiers that models interpret inconsistently' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      ambiguous: 'Ambiguous quantifier: "{{found}}". Consider specifying "{{suggestion}}".',
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
          for (let qi = 0; qi < COMPILED.length; qi++) {
            const regex = COMPILED[qi]
            regex.lastIndex = 0
            let match: RegExpExecArray | null
            while ((match = regex.exec(line)) !== null) {
              const suggestion = QUANTIFIER_SUGGESTIONS[match[0].toLowerCase()] ?? 'a specific value'
              const lineNode = node.children[i]
              const startOffset = lineNode.position.start.offset + match.index
              const endOffset = startOffset + match[0].length

              context.report({
                loc: {
                  start: { line: i + 1, column: match.index + 1 },
                  end: { line: i + 1, column: match.index + match[0].length + 1 },
                },
                messageId: 'ambiguous',
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
