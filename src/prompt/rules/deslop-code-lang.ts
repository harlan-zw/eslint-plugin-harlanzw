import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, isInScope, parseLineScopes, shouldSkipLine } from '../utils'

// Match inline code blocks ending with ) or > that don't already have {lang=...}
// Word boundary before opening backtick ensures we're not inside another construct
const INLINE_CODE_RE = /(?:^|(?<=[\s\p{P}]))`([^`]+[>)])`(?!\{lang)/gu

const LANG_MAP: Record<string, string> = {
  ')': 'ts',
  '>': 'html',
}

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Add lang tags to inline code blocks that look like code snippets' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      missingLang: 'Inline code `{{code}}` should have `{lang="{{lang}}"}` tag.',
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
          INLINE_CODE_RE.lastIndex = 0

          let match: RegExpExecArray | null
          while ((match = INLINE_CODE_RE.exec(line)) !== null) {
            // Skip if inside a link URL or link text
            if (isInScope(scopes, match.index, match.index + match[0].length, ['link-url']))
              continue
            const code = match[1]
            const lastChar = code.at(-1)
            const lang = LANG_MAP[lastChar]
            if (!lang)
              continue

            // Position of the closing backtick
            const closingBacktickIdx = match.index + match[0].length - 1
            const insertOffset = lineNode.position.start.offset + closingBacktickIdx + 1

            context.report({
              loc: {
                start: { line: i + 1, column: match.index + 1 },
                end: { line: i + 1, column: match.index + match[0].length + 1 },
              },
              messageId: 'missingLang',
              data: { code, lang },
              fix(fixer: any) {
                return fixer.insertTextAfterRange([insertOffset, insertOffset], `{lang="${lang}"}`)
              },
            })
          }
        }
      },
    }
  },
}
