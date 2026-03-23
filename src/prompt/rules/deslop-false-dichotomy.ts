import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, isInScope, parseLineScopes, shouldSkipLine } from '../utils'

// Matches: "it's not X — it's Y", "they're not X; they're Y", etc.
// Case-insensitive, requires distinct words after each contrast
const APOSTROPHE = `(?:'|\u2019)`
const SUBJECT_NOT = `(?:it${APOSTROPHE}s|it is|they${APOSTROPHE}re|they are|we${APOSTROPHE}re|we are|you${APOSTROPHE}re|you are|this is|that is|is|are)`
const SUBJECT_IS = `(?:it${APOSTROPHE}s|it is|they${APOSTROPHE}re|they are|we${APOSTROPHE}re|we are|you${APOSTROPHE}re|you are|this is|that is|is|are)`
const CONTRACTION_NOT = `(?:isn${APOSTROPHE}t|aren${APOSTROPHE}t|wasn${APOSTROPHE}t|weren${APOSTROPHE}t)`
const NO_LONGER = `(?:is|it${APOSTROPHE}s|was)`
const PATTERN = new RegExp(`\\b${SUBJECT_NOT}\\s+not\\b.{1,80}?\\b${SUBJECT_IS}\\b|\\b${CONTRACTION_NOT}\\s+(?:just\\s+)?about\\b.{1,80}?\\b(?:it${APOSTROPHE}s|is)\\s+about\\b|\\b${NO_LONGER}\\s+no\\s+longer\\b.{1,60}?\\b(?:it${APOSTROPHE}s|is)\\b`, 'i')

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Flag "it\'s not X — it\'s Y" contrast patterns common in AI-generated content' },
    schema: [],
    messages: {
      falseDichotomy: '"It\'s not X — it\'s Y" is a common AI writing pattern. Rewrite to state the point directly.',
    },
  },
  create(context: any) {
    return {
      document(_node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)
        const frontmatterEnd = getFrontmatterEnd(lines)

        for (let i = 0; i < lines.length; i++) {
          if (shouldSkipLine(i, codeBlockLines, frontmatterEnd))
            continue

          const line = lines[i]
          const scopes = parseLineScopes(line)
          const match = PATTERN.exec(line)

          if (!match)
            continue

          const matchStart = match.index
          const matchEnd = matchStart + match[0].length

          if (isInScope(scopes, matchStart, matchEnd, ['code', 'link-url']))
            continue

          context.report({
            loc: {
              start: { line: i + 1, column: matchStart + 1 },
              end: { line: i + 1, column: matchEnd + 1 },
            },
            messageId: 'falseDichotomy',
          })
        }
      },
    }
  },
}
