import type { DocumentNode } from '../types'
import {
  SKILL_ALLOWED_FIELDS,
  SKILL_COMPATIBILITY_MAX_LENGTH,
  SKILL_DESCRIPTION_MAX_LENGTH,
  SKILL_NAME_MAX_LENGTH,
  SKILL_NAME_PATTERN,
  SKILL_NAME_RESERVED,
} from '../constants'
import { parseFrontmatter } from '../utils'

const allowedSet = new Set<string>(SKILL_ALLOWED_FIELDS)

export default {
  meta: {
    type: 'problem' as const,
    docs: { description: 'Validate SKILL.md frontmatter field names, formats, and lengths' },
    fixable: 'code' as const,
    schema: [],
    messages: {
      unknownField: 'Unknown frontmatter field `{{field}}`. Allowed: {{allowed}}.',
      nameFormat: 'Skill name must be kebab-case (lowercase alphanumeric and hyphens).',
      nameHyphens: 'Skill name must not have leading, trailing, or consecutive hyphens.',
      nameLength: 'Skill name must be at most {{max}} characters (got {{length}}).',
      nameReserved: 'Skill name must not contain reserved term "{{term}}".',
      frontmatterBrackets: 'Frontmatter field `{{field}}` must not contain `<` or `>` (injection risk).',
      descriptionLength: 'Skill description must be at most {{max}} characters (got {{length}}).',
      compatibilityLength: 'Compatibility field must be at most {{max}} characters (got {{length}}).',
    },
  },
  create(context: any) {
    return {
      document(node: DocumentNode) {
        const lines: string[] = context.sourceCode.lines
        const fm = parseFrontmatter(lines)

        if (!fm.exists)
          return

        for (const field of fm.fields) {
          const lineNode = node.children[field.lineIndex]

          if (!allowedSet.has(field.key)) {
            context.report({
              node,
              loc: lineNode.position,
              messageId: 'unknownField',
              data: { field: field.key, allowed: SKILL_ALLOWED_FIELDS.join(', ') },
              fix(fixer: any) {
                const start = lineNode.position.start.offset
                // remove the line and its trailing newline
                const end = field.lineIndex + 1 < lines.length
                  ? node.children[field.lineIndex + 1].position.start.offset
                  : lineNode.position.end.offset
                return fixer.removeRange([start, end])
              },
            })
            continue
          }

          // Angle brackets forbidden in all frontmatter values (injection risk)
          if (/<|>/.test(field.value)) {
            context.report({ node, loc: lineNode.position, messageId: 'frontmatterBrackets', data: { field: field.key } })
          }

          if (field.key === 'name') {
            if (!SKILL_NAME_PATTERN.test(field.value)) {
              context.report({ node, loc: lineNode.position, messageId: 'nameFormat' })
            }
            else if (field.value.startsWith('-') || field.value.endsWith('-') || field.value.includes('--')) {
              context.report({ node, loc: lineNode.position, messageId: 'nameHyphens' })
            }
            for (const term of SKILL_NAME_RESERVED) {
              if (field.value.includes(term)) {
                context.report({ node, loc: lineNode.position, messageId: 'nameReserved', data: { term } })
              }
            }
            if (field.value.length > SKILL_NAME_MAX_LENGTH) {
              context.report({
                node,
                loc: lineNode.position,
                messageId: 'nameLength',
                data: { max: String(SKILL_NAME_MAX_LENGTH), length: String(field.value.length) },
              })
            }
          }

          if (field.key === 'description' && field.value.length > SKILL_DESCRIPTION_MAX_LENGTH) {
            context.report({
              node,
              loc: lineNode.position,
              messageId: 'descriptionLength',
              data: { max: String(SKILL_DESCRIPTION_MAX_LENGTH), length: String(field.value.length) },
            })
          }

          if (field.key === 'compatibility' && field.value.length > SKILL_COMPATIBILITY_MAX_LENGTH) {
            context.report({
              node,
              loc: lineNode.position,
              messageId: 'compatibilityLength',
              data: { max: String(SKILL_COMPATIBILITY_MAX_LENGTH), length: String(field.value.length) },
            })
          }
        }
      },
    }
  },
}
