import type { DocumentNode } from '../types'
import { AUTOLINK_DICTIONARY } from '../autolink-dictionary'
import { getCodeBlockLines, getFrontmatterEnd, isInScope, isInsideCompoundIdentifier, parseLineScopes, shouldSkipLine } from '../utils'

const REGEX_3 = /[.*+?^${}()|[\]\\]/g
const REGEX_2 = /^:{1,2}\w/
const REGEX_1 = /^\s+(\S)/

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

// Pre-compile regexes — require whitespace or start/end of line around matches (strict word boundary)
const COMPILED = DEDUPED_ENTRIES.map(([name, url]) => {
  const escaped = name.replace(REGEX_3, '\\$&')
  return { name, url, regex: new RegExp(`(?<=\\s|^)${escaped}(?=\\s|$|[.,;:!?)])`, 'g') }
})

// Regex to extract all markdown link URLs from a line: [text](url)
const LINK_URL_RE = /\[[^\]]*\]\(([^)]+)\)/g

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
        // Pre-scan for URLs already present as markdown links to avoid re-linking on ESLint re-runs
        const linkedUrls = new Set<string>()
        const allUrls = new Set(COMPILED.map(c => c.url))
        for (const line of lines) {
          LINK_URL_RE.lastIndex = 0
          let urlMatch: RegExpExecArray | null
          while ((urlMatch = LINK_URL_RE.exec(line)) !== null) {
            if (allUrls.has(urlMatch[1]))
              linkedUrls.add(urlMatch[1])
          }
        }

        for (let i = 0; i < lines.length; i++) {
          if (shouldSkipLine(i, codeBlockLines, frontmatterEnd))
            continue

          const line = lines[i]
          // Skip heading lines — typically don't want links in headings
          if (line.trimStart().startsWith('#'))
            continue
          // Skip MDC component lines — :ComponentName{...} or ::component-name
          if (REGEX_2.test(line.trimStart()))
            continue

          const lineNode = node.children[i]
          const scopes = parseLineScopes(line)

          for (const { name, url, regex } of COMPILED) {
            if (linkedUrls.has(url))
              continue

            regex.lastIndex = 0
            let match: RegExpExecArray | null
            while ((match = regex.exec(line)) !== null) {
              const matchStart = match.index
              const matchEnd = match.index + match[0].length

              // Skip if inside any markdown link (text or URL) or inline code
              if (isInScope(scopes, matchStart, matchEnd, ['link-text', 'link-url', 'code']))
                continue

              // Skip if part of a compound identifier (e.g., :github-repo-card, nuxt-seo, Vue.js)
              if (isInsideCompoundIdentifier(line, matchStart, matchEnd))
                continue

              // Skip if next word starts with a capital letter (compound name like "Nuxt SEO", "Tailwind CSS")
              const afterMatch = line.slice(matchEnd)
              const nextWordMatch = afterMatch.match(REGEX_1)
              if (nextWordMatch && nextWordMatch[1] >= 'A' && nextWordMatch[1] <= 'Z')
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
