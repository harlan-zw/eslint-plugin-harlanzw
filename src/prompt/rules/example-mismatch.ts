import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

const REGEX_2 = /input\s*:/gi
const REGEX_1 = /output\s*:/gi

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Warn when input and output example counts do not match' },
    schema: [],
    messages: {
      mismatch: 'Found {{inputCount}} input example(s) but {{outputCount}} output example(s). Ensure each input has a corresponding output.',
    },
  },
  create(context: any) {
    return {
      document(node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)
        const frontmatterEnd = getFrontmatterEnd(lines)

        const filteredText = lines
          .filter((_, i) => !shouldSkipLine(i, codeBlockLines, frontmatterEnd))
          .join('\n')

        const inputExamples = (filteredText.match(REGEX_2) ?? []).length
        const outputExamples = (filteredText.match(REGEX_1) ?? []).length

        if (inputExamples > 0 && outputExamples > 0 && inputExamples !== outputExamples) {
          context.report({
            node,
            messageId: 'mismatch',
            data: { inputCount: String(inputExamples), outputCount: String(outputExamples) },
          })
        }
      },
    }
  },
}
