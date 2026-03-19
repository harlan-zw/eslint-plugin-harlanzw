import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

const REGEX_2 = /<([a-z_][\w-]*)>/gi
const REGEX_1 = /<\/([a-z_][\w-]*)>/gi
const REGEX_INLINE_CODE = /`[^`]+`/g

export default {
  meta: {
    type: 'problem' as const,
    docs: { description: 'Detect mismatched XML-style tags' },
    fixable: undefined,
    schema: [],
    messages: {
      unclosed: 'Mismatched XML tag: <{{tag}}> appears {{openCount}} time(s) but </{{tag}}> appears {{closeCount}} time(s).',
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
          .map(line => line.replace(REGEX_INLINE_CODE, ''))
          .join('\n')

        const openTags = new Map<string, number>()
        const closeTags = new Map<string, number>()

        let match: RegExpExecArray | null
        const xmlOpen = REGEX_2
        while ((match = xmlOpen.exec(filteredText)) !== null) {
          const tag = match[1].toLowerCase()
          openTags.set(tag, (openTags.get(tag) ?? 0) + 1)
        }

        const xmlClose = REGEX_1
        while ((match = xmlClose.exec(filteredText)) !== null) {
          const tag = match[1].toLowerCase()
          closeTags.set(tag, (closeTags.get(tag) ?? 0) + 1)
        }

        for (const [tag, count] of openTags) {
          const closeCount = closeTags.get(tag) ?? 0
          if (count !== closeCount) {
            context.report({
              node,
              messageId: 'unclosed',
              data: { tag, openCount: String(count), closeCount: String(closeCount) },
            })
          }
        }

        for (const [tag, count] of closeTags) {
          if (!openTags.has(tag)) {
            context.report({
              node,
              messageId: 'unclosed',
              data: { tag, openCount: '0', closeCount: String(count) },
            })
          }
        }
      },
    }
  },
}
