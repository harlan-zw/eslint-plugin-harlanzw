import { getCodeBlockLines, getFrontmatterEnd, isInScope, parseLineScopes, shouldSkipLine } from '../utils'

const REGEX_1 = /\u2014/g

// Find all em dash positions on a line (excluding scoped regions)
function findEmDashes(line: string, scopes: ReturnType<typeof parseLineScopes>): number[] {
  const positions: number[] = []
  const regex = REGEX_1
  let match: RegExpExecArray | null
  while ((match = regex.exec(line)) !== null) {
    if (!isInScope(scopes, match.index, match.index + 1, ['code', 'link-url']))
      positions.push(match.index)
  }
  return positions
}

// Only inspect a spaced hyphen between letters. Ignore list markers and numeric ranges.
function findSpacedHyphens(line: string, scopes: ReturnType<typeof parseLineScopes>): number[] {
  const positions: number[] = []
  for (const match of line.matchAll(/\p{L}[ \t]+-(?=[ \t]+\p{L})/gu)) {
    const position = match.index + match[0].length - 1
    if (!isInScope(scopes, position, position + 1, ['code', 'link-url']))
      positions.push(position)
  }
  return positions
}

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Flag em dashes so sentences can be rewritten without them' },
    schema: [{
      type: 'object',
      properties: {
        checkSpacedHyphens: { type: 'boolean', default: false },
      },
      additionalProperties: false,
    }],
    messages: {
      spacedHyphen: 'Rewrite this sentence without a hyphen separator. Use a comma, colon, semicolon, or separate sentences.',
      emDash: 'Rewrite this sentence to avoid using an em dash as a separator. Use two sentences, a semicolon, or restructure with commas.',
    },
  },
  create(context: any) {
    const checkSpacedHyphens = context.options[0]?.checkSpacedHyphens === true
    return {
      document() {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)
        const frontmatterEnd = getFrontmatterEnd(lines)

        for (let i = 0; i < lines.length; i++) {
          if (shouldSkipLine(i, codeBlockLines, frontmatterEnd))
            continue

          const line = lines[i]
          const scopes = parseLineScopes(line)
          const positions = findEmDashes(line, scopes)

          const separators = positions.map(position => ({ position, messageId: 'emDash' }))
          if (checkSpacedHyphens) {
            for (const position of findSpacedHyphens(line, scopes))
              separators.push({ position, messageId: 'spacedHyphen' })
          }

          for (const { position: pos, messageId } of separators) {
            context.report({
              loc: {
                start: { line: i + 1, column: pos + 1 },
                end: { line: i + 1, column: pos + 2 },
              },
              messageId,
            })
          }
        }
      },
    }
  },
}
