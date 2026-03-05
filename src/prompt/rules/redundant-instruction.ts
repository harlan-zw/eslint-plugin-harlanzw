import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

const instructionRegex = /\b(?:must|should|always|never|avoid|do not|don't)\s+([^.!?\n]+)/gi

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Detect redundant or duplicate instructions' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      redundant: 'Similar instruction appears {{count}} times (lines {{lines}}). Consider consolidating.',
    },
  },
  create(context: any) {
    return {
      document(node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)
        const frontmatterEnd = getFrontmatterEnd(lines)

        const instructionPatterns = new Map<string, number[]>()

        for (let i = 0; i < lines.length; i++) {
          if (shouldSkipLine(i, codeBlockLines, frontmatterEnd))
            continue

          instructionRegex.lastIndex = 0
          let match: RegExpExecArray | null
          while ((match = instructionRegex.exec(lines[i])) !== null) {
            const normalized = match[1].toLowerCase().trim().replace(/\s+/g, ' ')
            if (normalized.length > 10) {
              const existing = instructionPatterns.get(normalized) ?? []
              existing.push(i)
              instructionPatterns.set(normalized, existing)
            }
          }
        }

        for (const [, lineIndices] of instructionPatterns) {
          if (lineIndices.length > 1) {
            const displayLines = lineIndices.map(l => l + 1)
            context.report({
              loc: {
                start: { line: lineIndices[0] + 1, column: 1 },
                end: { line: lineIndices[0] + 1, column: lines[lineIndices[0]].length + 1 },
              },
              messageId: 'redundant',
              data: { count: String(lineIndices.length), lines: displayLines.join(', ') },
              fix(fixer: any) {
                return lineIndices.slice(1).map((idx: number) => {
                  const lineNode = node.children[idx]
                  let start: number, end: number
                  if (idx + 1 < node.children.length) {
                    start = lineNode.position.start.offset
                    end = node.children[idx + 1].position.start.offset
                  }
                  else if (idx > 0) {
                    start = node.children[idx - 1].position.end.offset
                    end = lineNode.position.end.offset
                  }
                  else {
                    start = lineNode.position.start.offset
                    end = lineNode.position.end.offset
                  }
                  return fixer.removeRange([start, end])
                })
              },
            })
          }
        }
      },
    }
  },
}
