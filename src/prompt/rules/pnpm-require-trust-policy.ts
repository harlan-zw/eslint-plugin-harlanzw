import type { DocumentNode } from '../types'

const EXPECTED_KEY = 'trustPolicyIgnoreAfter'
const EXPECTED_VALUE = 262800
const EXPECTED_LINE = `${EXPECTED_KEY}: ${EXPECTED_VALUE}`

export default {
  meta: {
    type: 'problem' as const,
    docs: { description: `Require \`${EXPECTED_KEY}: ${EXPECTED_VALUE}\` in pnpm-workspace.yaml` },
    fixable: 'code' as const,
    schema: [],
    messages: {
      missing: `pnpm-workspace.yaml is missing \`${EXPECTED_LINE}\`.`,
      wrongValue: `\`${EXPECTED_KEY}\` should be \`${EXPECTED_VALUE}\`.`,
    },
  },
  create(context: any) {
    return {
      document(node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines

        // Find existing trustPolicyIgnoreAfter line
        const existingIdx = lines.findIndex((l: string) =>
          l.trim().startsWith(`${EXPECTED_KEY}:`),
        )

        if (existingIdx !== -1) {
          // Key exists, check value
          const match = lines[existingIdx].match(/trustPolicyIgnoreAfter:\s*(.+)/)
          const val = match?.[1]?.trim()
          if (val === String(EXPECTED_VALUE))
            return

          // Wrong value, fix it
          const lineNode = node.children[existingIdx]
          context.report({
            loc: {
              start: { line: existingIdx + 1, column: 1 },
              end: { line: existingIdx + 1, column: lines[existingIdx].length + 1 },
            },
            messageId: 'wrongValue',
            fix(fixer: any) {
              return fixer.replaceTextRange(
                [lineNode.position.start.offset, lineNode.position.end.offset],
                EXPECTED_LINE,
              )
            },
          })
          return
        }

        // Key is missing, add it at the end
        const lastLine = node.children.at(-1)
        const insertOffset = lastLine.position.end.offset
        const needsNewline = lines.at(-1).trim() !== ''

        context.report({
          loc: {
            start: { line: 1, column: 1 },
            end: { line: 1, column: 1 },
          },
          messageId: 'missing',
          fix(fixer: any) {
            return fixer.insertTextAfterRange(
              [insertOffset, insertOffset],
              `${needsNewline ? '\n' : ''}${EXPECTED_LINE}\n`,
            )
          },
        })
      },
    }
  },
}
