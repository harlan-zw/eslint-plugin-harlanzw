import type { DocumentNode } from '../types'
import { INEFFICIENT_PHRASES } from '../constants'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

const REGEX_1 = /[.*+?^${}()|[\]\\]/g

const poorlyTokenized = [
  /[A-Z]{10,}/g,
  /\w{20,}/g,
  /\d{10,}/g,
]

// Pre-compile verbose phrase regexes at module level
const COMPILED_PHRASES = Object.entries(INEFFICIENT_PHRASES).map(([phrase, replacement]) => {
  const escaped = phrase.replace(REGEX_1, '\\$&')
  return { regex: new RegExp(`\\b${escaped}\\b`, 'gi'), replacement }
})

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Detect content that may tokenize inefficiently' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      inefficient: '"{{found}}" may tokenize inefficiently. Consider breaking up or abbreviating.',
      verbose: '"{{found}}" can be shortened to "{{suggestion}}".',
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
          const reported = new Set<string>()

          // Check poorly tokenized strings
          for (const pattern of poorlyTokenized) {
            pattern.lastIndex = 0
            let match: RegExpExecArray | null
            while ((match = pattern.exec(line)) !== null) {
              const key = `${match.index}:${match[0].length}`
              if (reported.has(key))
                continue
              reported.add(key)

              const display = match[0].length > 20 ? `${match[0].substring(0, 20)}...` : match[0]
              context.report({
                loc: {
                  start: { line: i + 1, column: match.index + 1 },
                  end: { line: i + 1, column: match.index + match[0].length + 1 },
                },
                messageId: 'inefficient',
                data: { found: display },
              })
            }
          }

          // Check verbose phrases (fixable)
          for (const { regex, replacement } of COMPILED_PHRASES) {
            regex.lastIndex = 0
            let match: RegExpExecArray | null
            while ((match = regex.exec(line)) !== null) {
              const startOffset = lineNode.position.start.offset + match.index
              const endOffset = startOffset + match[0].length

              context.report({
                loc: {
                  start: { line: i + 1, column: match.index + 1 },
                  end: { line: i + 1, column: match.index + match[0].length + 1 },
                },
                messageId: 'verbose',
                data: { found: match[0], suggestion: replacement || '(remove)' },
                fix(fixer: any) {
                  return fixer.replaceTextRange([startOffset, endOffset], replacement)
                },
              })
            }
          }
        }
      },
    }
  },
}
