import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, isInScope, parseLineScopes, shouldSkipLine } from '../utils'

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Replace em dashes with plain dashes' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      emDash: 'Avoid em dashes in content. Use a plain dash instead.',
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
          const lineNode = node.children[i]
          const scopes = parseLineScopes(line)

          const regex = /\u2014/g
          let match: RegExpExecArray | null
          while ((match = regex.exec(line)) !== null) {
            if (isInScope(scopes, match.index, match.index + 1, ['code', 'link-url']))
              continue

            const startOffset = lineNode.position.start.offset + match.index
            const endOffset = startOffset + 1

            // Determine replacement: collapse surrounding spaces to " - "
            const before = line[match.index - 1]
            const after = line[match.index + 1]
            const spaceBefore = before === ' '
            const spaceAfter = after === ' '

            let fixStart = startOffset
            let fixEnd = endOffset
            const replacement = ' - '

            if (spaceBefore && spaceAfter) {
              // " — " -> " - " (consume both spaces)
              fixStart -= 1
              fixEnd += 1
            }
            else if (spaceBefore) {
              // " —x" -> " - x"
              fixStart -= 1
            }
            else if (spaceAfter) {
              // "x— " -> "x - "
              fixEnd += 1
            }

            context.report({
              loc: {
                start: { line: i + 1, column: match.index + 1 },
                end: { line: i + 1, column: match.index + 2 },
              },
              messageId: 'emDash',
              fix(fixer: any) {
                return fixer.replaceTextRange([fixStart, fixEnd], replacement)
              },
            })
          }
        }
      },
    }
  },
}
