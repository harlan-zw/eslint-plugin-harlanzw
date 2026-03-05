import type { DocumentNode } from '../types'
import { CASING_DICTIONARY } from '../casing-dictionary'
import { getCodeBlockLines, getFrontmatterEnd, isInScope, parseLineScopes, shouldSkipLine } from '../utils'

// Sort entries longest-first so multi-word entries match before single-word
const SORTED_ENTRIES = Object.entries(CASING_DICTIONARY)
  .sort((a, b) => b[0].length - a[0].length)

// Pre-compile regexes
const COMPILED = SORTED_ENTRIES.map(([key, correct]) => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Prose-level word boundaries: match only when surrounded by whitespace,
  // punctuation, or markdown syntax — not inside attribute values like {lang="html"}
  const B = `[\\s.,\\[\\]():;!?*#>/-]`
  return { regex: new RegExp(`(?:^|(?<=${B}))${escaped}(?=$|${B})`, 'gi'), correct }
})

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Enforce correct casing for tech terms, brands, and abbreviations' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      casing: '"{{found}}" should be "{{correct}}".',
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
          const matched: [number, number][] = []

          for (const { regex, correct } of COMPILED) {
            // Reset regex state for each line
            regex.lastIndex = 0
            let match: RegExpExecArray | null
            while ((match = regex.exec(line)) !== null) {
              // Already correctly cased — skip
              if (match[0] === correct)
                continue

              const matchStart = match.index
              const matchEnd = match.index + match[0].length

              // Skip if overlapping with a longer match
              if (matched.some(([s, e]) => matchStart >= s && matchEnd <= e))
                continue
              // Skip if inside a link URL or inline code
              if (isInScope(scopes, matchStart, matchEnd, ['link-url', 'code']))
                continue

              // Skip if part of a compound identifier (e.g., nuxt-seo, sitemap.xml, vite-ssg)
              const prevChar = matchStart > 0 ? line[matchStart - 1] : ''
              const nextChar = matchEnd < line.length ? line[matchEnd] : ''
              const prevPrev = matchStart > 1 ? line[matchStart - 2] : ''
              const nextNext = matchEnd + 1 < line.length ? line[matchEnd + 1] : ''
              if ((prevChar === '-' || prevChar === '.' || prevChar === '_') && /\w/.test(prevPrev))
                continue
              if ((nextChar === '-' || nextChar === '.' || nextChar === '_') && /\w/.test(nextNext))
                continue
              // Skip URL protocols (e.g., https://)
              if (line.slice(matchEnd, matchEnd + 3) === '://')
                continue
              matched.push([matchStart, matchEnd])

              const startOffset = lineNode.position.start.offset + matchStart
              const endOffset = startOffset + match[0].length

              context.report({
                loc: {
                  start: { line: i + 1, column: matchStart + 1 },
                  end: { line: i + 1, column: matchEnd + 1 },
                },
                messageId: 'casing',
                data: { found: match[0], correct },
                fix(fixer: any) {
                  return fixer.replaceTextRange([startOffset, endOffset], correct)
                },
              })
            }
          }
        }
      },
    }
  },
}
