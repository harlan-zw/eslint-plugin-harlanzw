import type { DocumentNode } from '../types'
import { VAGUE_TERMS } from '../constants'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Disallow vague terms that lack specific meaning for models' },
    schema: [],
    messages: {
      vague: 'Vague term: "{{found}}". Define what this means specifically for your use case.',
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
          for (const term of VAGUE_TERMS) {
            const regex = new RegExp(`\\bbe ${term}\\b|\\bin a ${term}\\b`, 'gi')
            let match: RegExpExecArray | null
            while ((match = regex.exec(line)) !== null) {
              context.report({
                loc: {
                  start: { line: i + 1, column: match.index + 1 },
                  end: { line: i + 1, column: match.index + match[0].length + 1 },
                },
                messageId: 'vague',
                data: { found: match[0] },
              })
            }
          }
        }
      },
    }
  },
}
