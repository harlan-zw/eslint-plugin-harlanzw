import type { DocumentNode } from '../types'
import { FALSE_SINCERITY_OPENERS } from '../deslop-constants'
import { getCodeBlockLines, getFrontmatterEnd, isInScope, isInsideCompoundIdentifier, parseLineScopes, shouldSkipLine } from '../utils'

const REGEX_ESCAPE = /[.*+?^${}()|[\]\\]/g
const APOSTROPHE = /\\'/g
const SENTENCE_START_PREFIX = /^[-*>\s#\d.]+$/
const SENTENCE_END = /[.:!?]\s+$/

// Pre-compile regexes at module level — match straight or curly apostrophes
const COMPILED = FALSE_SINCERITY_OPENERS.map((opener) => {
  const escaped = opener.replace(REGEX_ESCAPE, '\\$&').replace(APOSTROPHE, `['’]`)
  return { regex: new RegExp(`\\b${escaped}\\b\\s*,?\\s*`, 'gi'), opener }
})

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Remove false-sincerity openers that pad the sentence without adding meaning' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      falseSincerity: 'False-sincerity opener: "{{found}}". It signals nothing. State the point.',
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

          for (const { regex, opener } of COMPILED) {
            regex.lastIndex = 0
            let match: RegExpExecArray | null
            while ((match = regex.exec(line)) !== null) {
              const textBefore = line.slice(0, match.index)
              // Only flag as an opener: start of line, after a list/heading marker, or after a sentence boundary
              const isAtSentenceStart = match.index === 0
                || SENTENCE_START_PREFIX.test(textBefore)
                || SENTENCE_END.test(textBefore)
              if (!isAtSentenceStart)
                continue
              if (isInsideCompoundIdentifier(line, match.index, match.index + match[0].length))
                continue
              if (isInScope(scopes, match.index, match.index + match[0].length, ['code', 'link-url']))
                continue

              const startOffset = lineNode.position.start.offset + match.index
              const endOffset = startOffset + match[0].length
              const afterMatch = line.slice(match.index + match[0].length)

              context.report({
                loc: {
                  start: { line: i + 1, column: match.index + 1 },
                  end: { line: i + 1, column: match.index + match[0].length + 1 },
                },
                messageId: 'falseSincerity',
                data: { found: opener },
                fix(fixer: any) {
                  const nextChar = afterMatch[0]
                  if (nextChar >= 'a' && nextChar <= 'z') {
                    return [
                      fixer.replaceTextRange([startOffset, endOffset], ''),
                      fixer.replaceTextRange([endOffset, endOffset + 1], nextChar.toUpperCase()),
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
