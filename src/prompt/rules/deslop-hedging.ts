import type { DocumentNode } from '../types'
import { HEDGING_WORDS } from '../deslop-constants'
import { getCodeBlockLines, getFrontmatterEnd, isInScope, isInsideCompoundIdentifier, parseLineScopes, shouldSkipLine } from '../utils'

const REGEX_4 = /[.*+?^${}()|[\]\\]/g
const REGEX_3 = /(?:\bnot|n't|no longer|more than|rather than)\s+$/
const REGEX_2 = /^[-*>\s#\d.]+$/
const REGEX_1 = /[.:]\s+$/
const NEGATION_AFTER = /^(?:never|no|nothing|none|nobody|nowhere)\b/

// Pre-compile regexes at module level
const COMPILED = HEDGING_WORDS.map((word) => {
  const escaped = word.replace(REGEX_4, '\\$&')
  return { regex: new RegExp(`\\b${escaped}\\s+`, 'gi'), word }
})

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Remove hedging and qualifying words that weaken copy' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      hedging: 'Hedging word: "{{found}}". Remove it for more confident copy.',
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

          for (const { regex, word } of COMPILED) {
            regex.lastIndex = 0
            let match: RegExpExecArray | null
            while ((match = regex.exec(line)) !== null) {
              if (isInsideCompoundIdentifier(line, match.index, match.index + match[0].length))
                continue
              if (isInScope(scopes, match.index, match.index + match[0].length, ['code', 'link-url']))
                continue

              // "rather than" is a valid comparative, not hedging
              if (word === 'rather' && line.slice(match.index + match[0].length).startsWith('than'))
                continue

              // "not just" / "isn't just" / "no longer just" / "more than just" / "rather than just" etc. — removing "just" reverses meaning
              if (word === 'just' && REGEX_3.test(line.slice(Math.max(0, match.index - 20), match.index)))
                continue

              // "almost never" / "quite nothing" etc. — removing hedge before negation reverses meaning
              if (NEGATION_AFTER.test(line.slice(match.index + match[0].length)))
                continue
              const startOffset = lineNode.position.start.offset + match.index
              const endOffset = startOffset + match[0].length

              // Check if the match is at a sentence boundary (start of line or after ". ")
              const textBefore = line.slice(0, match.index)
              const isAtSentenceStart = match.index === 0
                || REGEX_2.test(textBefore)
                || REGEX_1.test(textBefore)

              context.report({
                loc: {
                  start: { line: i + 1, column: match.index + 1 },
                  end: { line: i + 1, column: match.index + match[0].length + 1 },
                },
                messageId: 'hedging',
                data: { found: word },
                fix(fixer: any) {
                  const afterText = line.slice(match!.index + match![0].length)
                  // If at sentence start and next char is lowercase, capitalize it
                  if (isAtSentenceStart && afterText.length > 0 && afterText[0] >= 'a' && afterText[0] <= 'z') {
                    return [
                      fixer.replaceTextRange([startOffset, endOffset], ''),
                      fixer.replaceTextRange([endOffset, endOffset + 1], afterText[0].toUpperCase()),
                    ]
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
