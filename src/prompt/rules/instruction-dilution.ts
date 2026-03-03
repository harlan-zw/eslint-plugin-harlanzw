import type { DocumentNode } from '../types'
import { STRENGTH_PATTERNS } from '../constants'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

const constraintWords = [...STRENGTH_PATTERNS.strong, ...STRENGTH_PATTERNS.medium]

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Warn when too many competing constraints may dilute effectiveness' },
    schema: [
      {
        type: 'object',
        properties: {
          maxConstraints: { type: 'number', minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      dilution: 'High number of constraints ({{count}}). Too many competing instructions may dilute their effectiveness.',
    },
  },
  create(context: any) {
    const maxConstraints = context.options[0]?.maxConstraints ?? 15

    return {
      document(node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)
        const frontmatterEnd = getFrontmatterEnd(lines)

        let constraintCount = 0
        for (let i = 0; i < lines.length; i++) {
          if (shouldSkipLine(i, codeBlockLines, frontmatterEnd))
            continue

          const lowerLine = lines[i].toLowerCase()
          if (constraintWords.some(w => lowerLine.includes(w)))
            constraintCount++
        }

        if (constraintCount > maxConstraints) {
          context.report({
            node,
            messageId: 'dilution',
            data: { count: String(constraintCount) },
          })
        }
      },
    }
  },
}
