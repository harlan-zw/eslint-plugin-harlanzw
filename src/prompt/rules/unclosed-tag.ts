import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

export default {
  meta: {
    type: 'problem' as const,
    docs: { description: 'Detect mismatched XML-style tags' },
    fixable: 'code' as const,
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
          .join('\n')

        const openTags = new Map<string, number>()
        const closeTags = new Map<string, number>()

        let match: RegExpExecArray | null
        const xmlOpen = /<([a-z_][\w-]*)>/gi
        while ((match = xmlOpen.exec(filteredText)) !== null) {
          const tag = match[1].toLowerCase()
          openTags.set(tag, (openTags.get(tag) ?? 0) + 1)
        }

        const xmlClose = /<\/([a-z_][\w-]*)>/gi
        while ((match = xmlClose.exec(filteredText)) !== null) {
          const tag = match[1].toLowerCase()
          closeTags.set(tag, (closeTags.get(tag) ?? 0) + 1)
        }

        const docEnd = node.position.end.offset

        for (const [tag, count] of openTags) {
          const closeCount = closeTags.get(tag) ?? 0
          if (count !== closeCount) {
            const missing = count - closeCount
            context.report({
              node,
              messageId: 'unclosed',
              data: { tag, openCount: String(count), closeCount: String(closeCount) },
              ...(missing > 0 && {
                fix(fixer: any) {
                  const closingTags = Array.from({ length: missing }, () => `</${tag}>`).join('\n')
                  return fixer.insertTextAfterRange([docEnd, docEnd], `\n${closingTags}`)
                },
              }),
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
