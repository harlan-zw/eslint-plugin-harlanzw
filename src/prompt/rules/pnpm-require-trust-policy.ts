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
      // YAMLDocument from yaml-eslint-parser
      YAMLDocument(node: any) {
        const mapping = node.content
        if (!mapping || mapping.type !== 'YAMLMapping')
          return

        const pair = mapping.pairs.find((p: any) =>
          p.key?.type === 'YAMLScalar' && p.key.value === EXPECTED_KEY,
        )

        if (pair) {
          const val = pair.value?.type === 'YAMLScalar' ? pair.value.value : undefined
          if (val === EXPECTED_VALUE)
            return

          context.report({
            node: pair,
            messageId: 'wrongValue',
            fix(fixer: any) {
              return fixer.replaceText(pair, EXPECTED_LINE)
            },
          })
          return
        }

        // Key missing, append at end of file
        const sourceCode = context.sourceCode
        const text = sourceCode.getText()
        const endsWithNewline = text.endsWith('\n')

        context.report({
          node: mapping,
          messageId: 'missing',
          fix(fixer: any) {
            const insertPos = text.length
            return fixer.insertTextAfterRange(
              [insertPos, insertPos],
              `${endsWithNewline ? '' : '\n'}\n${EXPECTED_LINE}\n`,
            )
          },
        })
      },
    }
  },
}
