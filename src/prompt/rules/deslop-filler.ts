import type { DocumentNode } from '../types'
import { FILLER_PHRASES } from '../deslop-constants'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

// Pre-compile regexes at module level
const COMPILED = FILLER_PHRASES.map((phrase) => {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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

          for (const { regex, phrase } of COMPILED) {
            regex.lastIndex = 0
            let match: RegExpExecArray | null
            while ((match = regex.exec(line)) !== null) {
              const startOffset = lineNode.position.start.offset + match.index
              const endOffset = startOffset + match[0].length

              // If the filler is at the start of a sentence, capitalize the next char
              const afterMatch = line.slice(match.index + match[0].length)
              const needsCapitalize = match.index === 0 || (line[match.index - 1] === ' ' && (match.index < 2 || line[match.index - 2] === '.'))

              context.report({
                loc: {
                  start: { line: i + 1, column: match.index + 1 },
                  end: { line: i + 1, column: match.index + match[0].length + 1 },
                },
                messageId: 'filler',
                data: { found: phrase },
                fix(fixer: any) {
                  const replacement = ''
                  if (needsCapitalize && afterMatch.length > 0) {
                    // Capitalize the character after removal
                    const nextChar = afterMatch[0]
                    if (nextChar >= 'a' && nextChar <= 'z') {
                      return [
                        fixer.replaceTextRange([startOffset, endOffset], ''),
                        fixer.replaceTextRange([endOffset, endOffset + 1], nextChar.toUpperCase()),
                      ]
                    }
                  }
                  return fixer.replaceTextRange([startOffset, endOffset], replacement)
                },
              })
            }
          }
        }
      },
    }
  },
}
