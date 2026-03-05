import type { DocumentNode } from '../types'
import { COMMON_CONTEXT_VARIABLES } from '../constants'
import { getCodeBlockLines, getFrontmatterEnd, shouldSkipLine } from '../utils'

const definitionPatterns = [
  /(\w+)\s*[:=]/g,
  /define\s+(\w+)/gi,
  /\{\{(\w+)\}\}\s*[:=]/g,
]

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Warn on variables referenced but potentially not defined' },
    schema: [
      {
        type: 'object',
        properties: {
          knownVariables: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      undefined: 'Variable \'{{{{{{name}}}}}}\' is referenced but may not be defined. Ensure it is provided in the runtime context.',
    },
  },
  create(context: any) {
    const extraKnown = new Set((context.options[0]?.knownVariables ?? []).map((v: string) => v.toLowerCase()))

    return {
      document(_node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)
        const frontmatterEnd = getFrontmatterEnd(lines)

        const definedVars = new Set<string>()
        const usedVars = new Map<string, { line: number, col: number }[]>()

        for (let i = 0; i < lines.length; i++) {
          if (shouldSkipLine(i, codeBlockLines, frontmatterEnd))
            continue

          const line = lines[i]

          for (const defPattern of definitionPatterns) {
            defPattern.lastIndex = 0
            let match: RegExpExecArray | null
            while ((match = defPattern.exec(line)) !== null)
              definedVars.add(match[1].toLowerCase())
          }

          const varRegex = /\{\{(\w+)\}\}/g
          let match: RegExpExecArray | null
          while ((match = varRegex.exec(line)) !== null) {
            const varName = match[1]
            const occurrences = usedVars.get(varName) ?? []
            occurrences.push({ line: i, col: match.index })
            usedVars.set(varName, occurrences)
          }
        }

        for (const [varName, occurrences] of usedVars) {
          const lower = varName.toLowerCase()
          if (definedVars.has(lower) || COMMON_CONTEXT_VARIABLES.has(lower) || extraKnown.has(lower))
            continue

          for (const occurrence of occurrences) {
            context.report({
              loc: {
                start: { line: occurrence.line + 1, column: occurrence.col + 1 },
                end: { line: occurrence.line + 1, column: occurrence.col + varName.length + 4 + 1 },
              },
              messageId: 'undefined',
              data: { name: varName },
            })
          }
        }
      },
    }
  },
}
