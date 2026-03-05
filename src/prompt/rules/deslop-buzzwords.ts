import type { DocumentNode } from '../types'
import { BUZZWORD_PHRASES } from '../deslop-constants'
import { getCodeBlockLines, getFrontmatterEnd, isInScope, parseLineScopes, shouldSkipLine } from '../utils'

// Sort phrases longest-first so longer matches take priority over shorter substrings
const SORTED_PHRASES = Object.entries(BUZZWORD_PHRASES)
  .sort((a, b) => b[0].length - a[0].length)

// Pre-compile regexes at module level
const COMPILED = SORTED_PHRASES.map(([phrase, replacement]) => {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const isSingleWord = !phrase.includes(' ') && !phrase.includes('-') && !phrase.includes('.')
  // Single-word entries require an adjacent word (min 2-word context) to reduce false positives
  const pattern = isSingleWord
    ? `(?<=\\S\\s)\\b${escaped}\\b|\\b${escaped}\\b(?=\\s\\S)`
    : `\\b${escaped}\\b`
  return { regex: new RegExp(pattern, 'gi'), phrase, replacement }
})

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Replace AI-generated buzzword phrases with simpler alternatives' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      buzzword: '"{{found}}" \u2192 "{{suggestion}}".',
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

          // Track matched ranges to avoid overlapping reports
          const matched: [number, number][] = []

          for (const { regex, replacement } of COMPILED) {
            regex.lastIndex = 0
            let match: RegExpExecArray | null
            while ((match = regex.exec(line)) !== null) {
              const matchStart = match.index
              const matchEnd = match.index + match[0].length

              // Skip if this range overlaps with an already-matched longer phrase
              if (matched.some(([s, e]) => matchStart >= s && matchEnd <= e))
                continue
              if (isInScope(scopes, matchStart, matchEnd, ['code', 'link-url']))
                continue
              matched.push([matchStart, matchEnd])

              const startOffset = lineNode.position.start.offset + matchStart
              const endOffset = startOffset + match[0].length

              // Preserve original casing for the replacement
              const fixedReplacement = match[0][0] === match[0][0].toUpperCase() && replacement
                ? replacement[0].toUpperCase() + replacement.slice(1)
                : replacement

              context.report({
                loc: {
                  start: { line: i + 1, column: matchStart + 1 },
                  end: { line: i + 1, column: matchEnd + 1 },
                },
                messageId: 'buzzword',
                data: { found: match[0], suggestion: fixedReplacement || '(remove)' },
                fix(fixer: any) {
                  return fixer.replaceTextRange([startOffset, endOffset], fixedReplacement)
                },
              })
            }
          }
        }
      },
    }
  },
}
