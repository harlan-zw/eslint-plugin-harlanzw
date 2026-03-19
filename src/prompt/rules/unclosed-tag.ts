import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

const REGEX_OPEN = /<([a-z_][\w-]*)>/gi
const REGEX_CLOSE = /<\/([a-z_][\w-]*)>/gi
const REGEX_INLINE_CODE = /`[^`]+`/g

// A tag is "structural" if at least one occurrence sits alone on its line
// (possibly with whitespace). Inline placeholders like <number> mid-sentence
// are ignored.
const STRUCTURAL_LINE_OPEN = /^\s*<([a-z_][\w-]*)>\s*$/i
const STRUCTURAL_LINE_CLOSE = /^\s*<\/([a-z_][\w-]*)>\s*$/i

export default {
  meta: {
    type: 'problem' as const,
    docs: { description: 'Detect mismatched XML-style tags' },
    fixable: undefined,
    schema: [],
    messages: {
      unclosed: 'Mismatched XML tag: <{{tag}}> appears {{openCount}} time(s) but </{{tag}}> appears {{closeCount}} time(s).',
    },
  },
  create(context: any) {
    return {
      document(node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)
        const frontmatterEnd = getFrontmatterEnd(lines)

        // First pass: identify which tag names are structural (appear on own line)
        const structuralTags = new Set<string>()
        for (let i = 0; i < lines.length; i++) {
          if (shouldSkipLine(i, codeBlockLines, frontmatterEnd))
            continue
          const line = lines[i].replace(REGEX_INLINE_CODE, '')
          let m: RegExpExecArray | null
          STRUCTURAL_LINE_OPEN.lastIndex = 0
          if ((m = STRUCTURAL_LINE_OPEN.exec(line)) !== null)
            structuralTags.add(m[1].toLowerCase())
          STRUCTURAL_LINE_CLOSE.lastIndex = 0
          if ((m = STRUCTURAL_LINE_CLOSE.exec(line)) !== null)
            structuralTags.add(m[1].toLowerCase())
        }

        if (structuralTags.size === 0)
          return

        // Second pass: count all opens/closes but only for structural tags
        const filteredText = lines
          .filter((_, i) => !shouldSkipLine(i, codeBlockLines, frontmatterEnd))
          .map(line => line.replace(REGEX_INLINE_CODE, ''))
          .join('\n')

        const openTags = new Map<string, number>()
        const closeTags = new Map<string, number>()

        let match: RegExpExecArray | null
        REGEX_OPEN.lastIndex = 0
        while ((match = REGEX_OPEN.exec(filteredText)) !== null) {
          const tag = match[1].toLowerCase()
          if (structuralTags.has(tag))
            openTags.set(tag, (openTags.get(tag) ?? 0) + 1)
        }

        REGEX_CLOSE.lastIndex = 0
        while ((match = REGEX_CLOSE.exec(filteredText)) !== null) {
          const tag = match[1].toLowerCase()
          if (structuralTags.has(tag))
            closeTags.set(tag, (closeTags.get(tag) ?? 0) + 1)
        }

        for (const [tag, count] of openTags) {
          const closeCount = closeTags.get(tag) ?? 0
          if (count !== closeCount) {
            context.report({
              node,
              messageId: 'unclosed',
              data: { tag, openCount: String(count), closeCount: String(closeCount) },
            })
          }
        }

        for (const [tag, count] of closeTags) {
          if (!openTags.has(tag)) {
            context.report({
              node,
              messageId: 'unclosed',
              data: { tag, openCount: '0', closeCount: String(count) },
            })
          }
        }
      },
    }
  },
}
