import type { DocumentNode } from '../types'
import { SKILL_REQUIRED_FIELDS } from '../constants'
import { parseFrontmatter } from '../utils'

export default {
  meta: {
    type: 'problem' as const,
    docs: { description: 'Require frontmatter with required fields in SKILL.md' },
    schema: [],
    messages: {
      missingFrontmatter: 'SKILL.md must have YAML frontmatter delimited by `---`.',
      missingField: 'SKILL.md frontmatter is missing required field: `{{field}}`.',
    },
  },
  create(context: any) {
    return {
      document(node: DocumentNode) {
        const lines: string[] = context.sourceCode.lines
        const fm = parseFrontmatter(lines)

        if (!fm.exists) {
          context.report({ node, messageId: 'missingFrontmatter' })
          return
        }

        const presentKeys = new Set(fm.fields.map(f => f.key))
        for (const field of SKILL_REQUIRED_FIELDS) {
          if (!presentKeys.has(field)) {
            context.report({ node, messageId: 'missingField', data: { field } })
          }
        }
      },
    }
  },
}
