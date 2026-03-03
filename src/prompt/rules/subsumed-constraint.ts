import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Detect constraints subsumed by stronger ones (e.g. "avoid X" with "never X")' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      subsumed: '"Avoid" on line {{avoidLine}} may be subsumed by "Never" on line {{neverLine}}. Consider removing the weaker constraint.',
    },
  },
  create(context: any) {
    return {
      document(node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)
        const frontmatterEnd = getFrontmatterEnd(lines)

        const neverPatterns: { text: string, line: number }[] = []
        const avoidPatterns: { text: string, line: number }[] = []

        for (let i = 0; i < lines.length; i++) {
          if (shouldSkipLine(i, codeBlockLines, frontmatterEnd))
            continue

          const neverMatch = lines[i].match(/never\s+([^.!?\n]+)/i)
          if (neverMatch)
            neverPatterns.push({ text: neverMatch[1].toLowerCase(), line: i })

          const avoidMatch = lines[i].match(/avoid\s+([^.!?\n]+)/i)
          if (avoidMatch)
            avoidPatterns.push({ text: avoidMatch[1].toLowerCase(), line: i })
        }

        for (const avoidP of avoidPatterns) {
          for (const neverP of neverPatterns) {
            const overlap
              = avoidP.text.includes(neverP.text.substring(0, 20))
                || neverP.text.includes(avoidP.text.substring(0, 20))
            if (overlap) {
              const lineIdx = avoidP.line
              context.report({
                loc: {
                  start: { line: lineIdx + 1, column: 1 },
                  end: { line: lineIdx + 1, column: lines[lineIdx].length + 1 },
                },
                messageId: 'subsumed',
                data: { avoidLine: String(lineIdx + 1), neverLine: String(neverP.line + 1) },
                fix(fixer: any) {
                  const lineNode = node.children[lineIdx]
                  let start: number, end: number
                  if (lineIdx + 1 < node.children.length) {
                    start = lineNode.position.start.offset
                    end = node.children[lineIdx + 1].position.start.offset
                  }
                  else if (lineIdx > 0) {
                    start = node.children[lineIdx - 1].position.end.offset
                    end = lineNode.position.end.offset
                  }
                  else {
                    start = lineNode.position.start.offset
                    end = lineNode.position.end.offset
                  }
                  return fixer.removeRange([start, end])
                },
              })
              break
            }
          }
        }
      },
    }
  },
}
