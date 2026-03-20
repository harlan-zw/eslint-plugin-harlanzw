import type { DocumentNode } from '../types'
import { parseFrontmatter } from '../utils'

export default {
  meta: {
    type: 'layout' as const,
    docs: { description: 'Remove empty lines inside YAML frontmatter' },
    fixable: 'whitespace' as const,
    schema: [],
    messages: {
      emptyLine: 'Remove empty line inside frontmatter.',
    },
  },
  create(context: any) {
    return {
      document(node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const fm = parseFrontmatter(lines)

        if (!fm.exists)
          return

        // Check lines between opening --- (line 0) and closing --- (fm.endLine)
        // We want to flag any blank lines inside the frontmatter body
        for (let i = fm.startLine + 1; i < fm.endLine; i++) {
          if (lines[i].trim() === '') {
            const lineNode = node.children[i]
            const startOffset = lineNode.position.start.offset
            // Remove the entire blank line including its trailing newline
            // The line itself is empty, so we remove from start of this line to start of next line
            const nextLineNode = node.children[i + 1]
            const endOffset = nextLineNode
              ? nextLineNode.position.start.offset
              : lineNode.position.end.offset

            context.report({
              loc: {
                start: { line: i + 1, column: 1 },
                end: { line: i + 1, column: 1 },
              },
              messageId: 'emptyLine',
              fix(fixer: any) {
                return fixer.removeRange([startOffset, endOffset])
              },
            })
          }
        }
      },
    }
  },
}
