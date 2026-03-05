import type { DocumentNode } from '../types'
import { HEDGING_WORDS } from '../deslop-constants'
import { getCodeBlockLines, getFrontmatterEnd, isInScope, parseLineScopes, shouldSkipLine } from '../utils'

// Pre-compile regexes at module level
const COMPILED = HEDGING_WORDS.map((word) => {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
              if (isInScope(scopes, match.index, match.index + match[0].length, ['code', 'link-url']))
                continue

              // "rather than" is a valid comparative, not hedging
              if (word === 'rather' && line.slice(match.index + match[0].length).startsWith('than'))
                continue

              // "not just" / "isn't just" / "no longer just" / "more than just" / "rather than just" etc. — removing "just" reverses meaning
              if (word === 'just' && /(?:\bnot|n't|no longer|more than|rather than)\s+$/.test(line.slice(Math.max(0, match.index - 20), match.index)))
                continue
              const startOffset = lineNode.position.start.offset + match.index
              const endOffset = startOffset + match[0].length

              context.report({
                loc: {
                  start: { line: i + 1, column: match.index + 1 },
                  end: { line: i + 1, column: match.index + match[0].length + 1 },
                },
                messageId: 'hedging',
                data: { found: word },
                fix(fixer: any) {
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
