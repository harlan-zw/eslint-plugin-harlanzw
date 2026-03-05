import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

const unresolvedPatterns = [
  /\b(?:mentioned|described|shown|listed|given)\s+(?:above|below|earlier|previously|before)\b/gi,
  /\bthe\s+(?:above|below|following|preceding)\s+(?:format|example|instructions?|rules?|guidelines?)\b/gi,
  /\bsee\s+(?:above|below)\b/gi,
  /\bas\s+(?:mentioned|described|stated)\b/gi,
]

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Warn on potentially unresolved positional references' },
    schema: [],
    messages: {
      unresolved: 'Potentially unresolved reference: "{{found}}". Ensure the referenced content exists and is clear.',
    },
  },
  create(context: any) {
    return {
      document(_node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)
        const frontmatterEnd = getFrontmatterEnd(lines)

        for (let i = 0; i < lines.length; i++) {
          if (shouldSkipLine(i, codeBlockLines, frontmatterEnd))
            continue

          const line = lines[i]
          for (const pattern of unresolvedPatterns) {
            pattern.lastIndex = 0
            let match: RegExpExecArray | null
            while ((match = pattern.exec(line)) !== null) {
              context.report({
                loc: {
                  start: { line: i + 1, column: match.index + 1 },
                  end: { line: i + 1, column: match.index + match[0].length + 1 },
                },
                messageId: 'unresolved',
                data: { found: match[0] },
              })
            }
          }
        }
      },
    }
  },
}
