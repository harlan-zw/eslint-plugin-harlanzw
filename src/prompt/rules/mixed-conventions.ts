import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

const REGEX_2 = /<[a-z_]+>/i
const REGEX_1 = /^#{1,6}\s+/

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Warn when mixing XML and Markdown formatting conventions' },
    schema: [],
    messages: {
      mixed: 'Mixed XML and Markdown formatting detected. Consider using a consistent convention.',
    },
  },
  create(context: any) {
    return {
      document(node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)
        const frontmatterEnd = getFrontmatterEnd(lines)

        let hasXmlTags = false
        let hasMarkdownHeaders = false

        for (let i = 0; i < lines.length; i++) {
          if (shouldSkipLine(i, codeBlockLines, frontmatterEnd))
            continue

          const line = lines[i]
          if (REGEX_2.test(line))
            hasXmlTags = true
          if (REGEX_1.test(line))
            hasMarkdownHeaders = true
        }

        if (hasXmlTags && hasMarkdownHeaders) {
          context.report({
            node,
            messageId: 'mixed',
          })
        }
      },
    }
  },
}
