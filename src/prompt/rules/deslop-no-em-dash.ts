import type { DocumentNode } from '../types'
import { getCodeBlockLines, getFrontmatterEnd, isInScope, parseLineScopes, shouldSkipLine } from '../utils'

// Find all em dash positions on a line (excluding scoped regions)
function findEmDashes(line: string, scopes: ReturnType<typeof parseLineScopes>): number[] {
  const positions: number[] = []
  const regex = /\u2014/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(line)) !== null) {
    if (!isInScope(scopes, match.index, match.index + 1, ['code', 'link-url']))
      positions.push(match.index)
  }
  return positions
}

// Check if text before the em dash looks like a label/title:
// **bold**, ### heading, or list item prefix (- **bold**)
const LABEL_BEFORE = /(?:\*\*[^*]+\*\*|#{1,6}\s+\S.*?)\s*$/

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Replace em dashes with plain dashes, commas, or colons' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      emDash: 'Avoid em dashes in content. Use a plain dash instead.',
      emDashParen: 'Avoid em dashes for parentheticals. Use commas instead.',
      emDashColon: 'Avoid em dashes after labels. Use a colon instead.',
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
          const positions = findEmDashes(line, scopes)

          if (positions.length === 0)
            continue

          // Detect paired em dashes (parenthetical aside) — exactly 2 on the line
          // with text between them (not at start/end of meaningful content)
          const isPair = positions.length === 2
            && positions[0] > 0
            && positions[1] < line.length - 1

          for (const pos of positions) {
            const startOffset = lineNode.position.start.offset + pos
            const endOffset = startOffset + 1

            const before = line[pos - 1]
            const after = line[pos + 1]
            const spaceBefore = before === ' '
            const spaceAfter = after === ' '

            let fixStart = startOffset
            let fixEnd = endOffset

            // Check for label pattern: **Title** — description
            const textBefore = line.slice(0, pos)
            const isLabel = positions.length === 1 && LABEL_BEFORE.test(textBefore)

            if (isPair) {
              // Parenthetical: replace with comma
              // "word — aside — continues" -> "word, aside, continues"
              const replacement = ','

              if (spaceBefore && spaceAfter) {
                // " — " -> ", " (consume space before, keep space after)
                fixStart -= 1
              }
              else if (!spaceAfter) {
                // "word—next" -> "word, next"
                report(context, i, pos, 'emDashParen', fixStart, fixEnd, ', ')
                continue
              }

              report(context, i, pos, 'emDashParen', fixStart, fixEnd, replacement)
            }
            else if (isLabel) {
              // Label/title pattern: replace with colon
              // "**Performance** — how to optimize" -> "**Performance**: how to optimize"
              // Consume the space before the em dash, colon attaches to label
              if (spaceBefore && spaceAfter) {
                fixStart -= 1
              }
              else if (spaceBefore) {
                fixStart -= 1
              }

              const replacement = spaceAfter ? ':' : ': '
              report(context, i, pos, 'emDashColon', fixStart, fixEnd, replacement)
            }
            else {
              // Default: replace with " - "
              const replacement = ' - '

              if (spaceBefore && spaceAfter) {
                fixStart -= 1
                fixEnd += 1
              }
              else if (spaceBefore) {
                fixStart -= 1
              }
              else if (spaceAfter) {
                fixEnd += 1
              }

              report(context, i, pos, 'emDash', fixStart, fixEnd, replacement)
            }
          }
        }
      },
    }
  },
}

function report(context: any, lineIdx: number, col: number, messageId: string, fixStart: number, fixEnd: number, replacement: string) {
  context.report({
    loc: {
      start: { line: lineIdx + 1, column: col + 1 },
      end: { line: lineIdx + 1, column: col + 2 },
    },
    messageId,
    fix(fixer: any) {
      return fixer.replaceTextRange([fixStart, fixEnd], replacement)
    },
  })
}
