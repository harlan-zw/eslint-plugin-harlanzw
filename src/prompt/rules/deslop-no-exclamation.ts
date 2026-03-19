import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, isInScope, parseLineScopes, shouldSkipLine } from '../utils'

const REGEX_2 = /!(?!\[)/g
const REGEX_1 = /\w/

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Remove exclamation marks from content prose' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      exclamation: 'Avoid exclamation marks in content. Replace with a period.',
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

          // Skip markdown image syntax ![alt](url)
          // Skip headings that are just markers
          const regex = REGEX_2
          let match: RegExpExecArray | null
          while ((match = regex.exec(line)) !== null) {
            if (isInScope(scopes, match.index, match.index + 1, ['code', 'link-url']))
              continue
            // Only replace ! that ends a sentence (preceded by a word char)
            if (match.index === 0 || !REGEX_1.test(line[match.index - 1]))
              continue
            // Skip brand names like Yahoo! where ! follows a capitalized word
            const beforeBang = line.slice(0, match.index)
            const wordMatch = beforeBang.match(/(\w+)$/)
            if (wordMatch && /^[A-Z]/.test(wordMatch[1]))
              continue

            const startOffset = lineNode.position.start.offset + match.index
            const endOffset = startOffset + 1

            context.report({
              loc: {
                start: { line: i + 1, column: match.index + 1 },
                end: { line: i + 1, column: match.index + 2 },
              },
              messageId: 'exclamation',
              fix(fixer: any) {
                return fixer.replaceTextRange([startOffset, endOffset], '.')
              },
            })
          }
        }
      },
    }
  },
}
