import type { DocumentNode } from '../types'
import { getCodeBlockLines } from '../utils'

// Match <script ...> that does NOT already have lang="ts" or lang='ts'
const SCRIPT_TAG_RE = /^<script(?:\s[^>]*)?>$/
const HAS_LANG_TS = /\blang=["']ts["']/

export default {
  meta: {
    type: 'suggestion' as const,
    docs: { description: 'Require lang="ts" on Vue <script> blocks in code examples' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      missingLangTs: 'Vue `<script>` block should have `lang="ts"`.',
    },
  },
  create(context: any) {
    return {
      document(node: DocumentNode) {
        const sourceCode = context.sourceCode
        const lines: string[] = sourceCode.lines
        const codeBlockLines = getCodeBlockLines(lines)

        // Track which code blocks are Vue
        let inVueBlock = false

        for (let i = 0; i < lines.length; i++) {
          const trimmed = lines[i].trimStart()

          // Detect opening of a vue code block
          if (trimmed.startsWith('```vue')) {
            inVueBlock = true
            continue
          }

          // Detect closing of code block
          if (trimmed.startsWith('```') && inVueBlock) {
            inVueBlock = false
            continue
          }

          if (!inVueBlock || !codeBlockLines.has(i))
            continue

          const line = lines[i]
          const match = SCRIPT_TAG_RE.exec(line.trim())
          if (!match)
            continue

          // Already has lang="ts"
          if (HAS_LANG_TS.test(line))
            continue

          const lineNode = node.children[i]
          // Find the position of '>' to insert before it
          const closingBracketIdx = line.lastIndexOf('>')
          if (closingBracketIdx === -1)
            continue

          const insertOffset = lineNode.position.start.offset + closingBracketIdx

          context.report({
            loc: {
              start: { line: i + 1, column: 1 },
              end: { line: i + 1, column: line.length + 1 },
            },
            messageId: 'missingLangTs',
            fix(fixer: any) {
              return fixer.insertTextBeforeRange([insertOffset, insertOffset], ' lang="ts"')
            },
          })
        }
      },
    }
  },
}
