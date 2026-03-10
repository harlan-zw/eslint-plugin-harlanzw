import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

const REGEX_3 = /json|object|array|\{|\[/i
const REGEX_2 = /output|respond|return/i
const REGEX_1 = /format|structure|schema/i

const examplePatterns = [
  /examples?:/i,
  /for example/i,
  /e\.g\./i,
  /such as:/i,
  /here's how/i,
  /sample\s+(?:input|output|response)/i,
]

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Warn when output format is specified but no examples are provided' },
    schema: [],
    messages: {
      missing: 'Output format specified but no examples provided. Adding a few-shot example can clarify expected structure.',
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

        const hasExamples = examplePatterns.some(p => p.test(filteredText))
        const hasJsonOutput = REGEX_3.test(filteredText) && REGEX_2.test(filteredText)
        const hasFormatRequirement = REGEX_1.test(filteredText)

        if ((hasJsonOutput || hasFormatRequirement) && !hasExamples) {
          context.report({
            node,
            messageId: 'missing',
          })
        }
      },
    }
  },
}
