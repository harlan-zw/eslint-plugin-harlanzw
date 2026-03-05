import type { DocumentNode } from '../types'
import { AUTOLINK_DICTIONARY } from '../autolink-dictionary'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

// Sort entries longest-first so multi-word entries match before single-word
const SORTED_ENTRIES = Object.entries(AUTOLINK_DICTIONARY)
  .sort((a, b) => b[0].length - a[0].length)

// Deduplicate entries that share the same URL (e.g. "TailwindCSS" and "Tailwind CSS")
const SEEN_URLS = new Map<string, string>()
const DEDUPED_ENTRIES = SORTED_ENTRIES.filter(([name, url]) => {
  if (SEEN_URLS.has(url))
    return true // keep all — dedup is per-document at runtime
  SEEN_URLS.set(url, name)
  return true
})

// Pre-compile regexes — match the term only when NOT already inside a markdown link
const COMPILED = DEDUPED_ENTRIES.map(([name, url]) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return { name, url, regex: new RegExp(`(?<!\\[)\\b${escaped}\\b(?!\\])(?!\\()`, 'g') }
})

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Auto-link first mention of known tech terms to their canonical URLs' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      autolink: '"{{name}}" should link to {{url}}.',
    },
  },
  create(context: any) {
    return {
      document(node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)
        const frontmatterEnd = getFrontmatterEnd(lines)

        // Track which URLs have been linked (first-occurrence-only)
        const linkedUrls = new Set<string>()

        for (let i = 0; i < lines.length; i++) {
          if (shouldSkipLine(i, codeBlockLines, frontmatterEnd))
            continue

          const line = lines[i]
          // Skip heading lines — typically don't want links in headings
          if (line.trimStart().startsWith('#'))
            continue

          const lineNode = node.children[i]

          for (const { name, url, regex } of COMPILED) {
            if (linkedUrls.has(url))
              continue

            regex.lastIndex = 0
            let match: RegExpExecArray | null
            while ((match = regex.exec(line)) !== null) {
              // Verify this isn't inside an existing markdown link
              // Check if preceded by [ or followed by ]( pattern
              const before = line.slice(0, match.index)
              const after = line.slice(match.index + match[0].length)

              // Skip if inside [text](url) — either as text or url part
              if (before.includes('[') && !before.includes(']'))
                continue
              if (after.startsWith(']('))
                continue
              // Skip if inside inline code
              const backticksBefore = (before.match(/`/g) || []).length
              if (backticksBefore % 2 === 1)
                continue

              const startOffset = lineNode.position.start.offset + match.index
              const endOffset = startOffset + match[0].length

              linkedUrls.add(url)

              context.report({
                loc: {
                  start: { line: i + 1, column: match.index + 1 },
                  end: { line: i + 1, column: match.index + match[0].length + 1 },
                },
                messageId: 'autolink',
                data: { name, url },
                fix(fixer: any) {
                  return fixer.replaceTextRange(
                    [startOffset, endOffset],
                    `[${match![0]}](${url})`,
                  )
                },
              })

              break // first occurrence only
            }
          }
        }
      },
    }
  },
}
