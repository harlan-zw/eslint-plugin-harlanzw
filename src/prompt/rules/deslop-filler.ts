import type { DocumentNode } from '../types'
import { FILLER_PHRASES } from '../deslop-constants'
import { getCodeBlockLines, getFrontmatterEnd, isInScope, isInsideCompoundIdentifier, parseLineScopes, shouldSkipLine } from '../utils'

const REGEX_3 = /[.*+?^${}()|[\]\\]/g
const REGEX_2 = /^[-*>\s#\d.]+$/
const REGEX_1 = /\.\s+$/

// Pre-compile regexes at module level
const COMPILED = FILLER_PHRASES.map((phrase) => {
  const escaped = phrase.replace(REGEX_3, '\\$&')
  return { regex: new RegExp(`\\b${escaped}\\s*,?\\s*`, 'gi'), phrase }
})

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Remove AI-generated filler sentences and phrases' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      filler: 'Filler phrase: "{{found}}". Remove it.',
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

          for (const { regex, phrase } of COMPILED) {
            regex.lastIndex = 0
            let match: RegExpExecArray | null
            while ((match = regex.exec(line)) !== null) {
              if (isInsideCompoundIdentifier(line, match.index, match.index + match[0].length))
                continue
              if (isInScope(scopes, match.index, match.index + match[0].length, ['code', 'link-url']))
                continue
              const startOffset = lineNode.position.start.offset + match.index
              const endOffset = startOffset + match[0].length

              const afterMatch = line.slice(match.index + match[0].length)
              // Check if the filler is at a sentence boundary
              const textBefore = line.slice(0, match.index)
              const isAtSentenceStart = match.index === 0
                || REGEX_2.test(textBefore)
                || REGEX_1.test(textBefore)

              context.report({
                loc: {
                  start: { line: i + 1, column: match.index + 1 },
                  end: { line: i + 1, column: match.index + match[0].length + 1 },
                },
                messageId: 'filler',
                data: { found: phrase },
                fix(fixer: any) {
                  if (isAtSentenceStart && afterMatch.length > 0) {
                    const nextChar = afterMatch[0]
                    if (nextChar >= 'a' && nextChar <= 'z') {
                      return [
                        fixer.replaceTextRange([startOffset, endOffset], ''),
                        fixer.replaceTextRange([endOffset, endOffset + 1], nextChar.toUpperCase()),
                      ]
                    }
                  }
                  return fixer.replaceTextRange([startOffset, endOffset], '')
                },
              })
            }
          }
        }
      },
    }
  },
}
