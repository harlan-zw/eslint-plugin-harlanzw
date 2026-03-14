import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'nuxt-ui-prefer-shorthand-css'
export type MessageIds = 'preferShorthand'
export type Options = []

/**
 * Mapping of verbose var() CSS classes to their Nuxt UI shorthand equivalents.
 * Only includes replacements that are safe when no opacity modifier is present.
 */
const REPLACEMENTS: Record<string, string> = {
  // text
  'text-[var(--ui-text)]': 'text-default',
  'text-[var(--ui-text-highlighted)]': 'text-highlighted',
  'text-[var(--ui-text-toned)]': 'text-toned',
  'text-[var(--ui-text-inverted)]': 'text-inverted',
  'text-[var(--ui-text-muted)]': 'text-muted',
  'text-[var(--ui-text-dimmed)]': 'text-dimmed',
  // bg
  'bg-[var(--ui-bg)]': 'bg-default',
  'bg-[var(--ui-bg-elevated)]': 'bg-elevated',
  'bg-[var(--ui-bg-muted)]': 'bg-muted',
  'bg-[var(--ui-bg-accented)]': 'bg-accented',
  'bg-[var(--ui-bg-inverted)]': 'bg-inverted',
  // border
  'border-[var(--ui-border)]': 'border-default',
  'border-[var(--ui-border-accented)]': 'border-accented',
  'border-[var(--ui-border-muted)]': 'border-muted',
  'border-[var(--ui-border-inverted)]': 'border-inverted',
  // --ui-primary across all color utilities
  ...Object.fromEntries(
    ['text', 'bg', 'border', 'ring', 'outline', 'divide', 'accent', 'caret', 'fill', 'stroke', 'shadow', 'decoration'].map(
      p => [`${p}-[var(--ui-primary)]`, `${p}-primary`],
    ),
  ),
}

/**
 * Tokens that support opacity modifiers (e.g. bg-[var(--ui-bg-elevated)]/50).
 * When followed by `/`, the verbose form is required and should not be flagged.
 */
const OPACITY_SAFE = new Set([
  'bg-[var(--ui-bg-elevated)]',
  'bg-[var(--ui-bg-muted)]',
  'bg-[var(--ui-bg-accented)]',
  'border-[var(--ui-border-accented)]',
  'border-[var(--ui-border-muted)]',
  ...['text', 'bg', 'border', 'ring', 'outline', 'divide', 'accent', 'caret', 'fill', 'stroke', 'shadow', 'decoration'].map(
    p => `${p}-[var(--ui-primary)]`,
  ),
])

function findVerboseClasses(value: string): { match: string, replacement: string, index: number }[] {
  const results: { match: string, replacement: string, index: number }[] = []
  for (const [verbose, shorthand] of Object.entries(REPLACEMENTS)) {
    let searchFrom = 0
    while (true) {
      const idx = value.indexOf(verbose, searchFrom)
      if (idx === -1)
        break
      // Skip if this token is followed by / (opacity modifier)
      const afterIdx = idx + verbose.length
      if (OPACITY_SAFE.has(verbose) && afterIdx < value.length && value[afterIdx] === '/') {
        searchFrom = afterIdx
        continue
      }
      results.push({ match: verbose, replacement: shorthand, index: idx })
      searchFrom = afterIdx
    }
  }
  return results
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer Nuxt UI shorthand CSS classes over verbose var() syntax',
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferShorthand: 'Use "{{shorthand}}" instead of "{{verbose}}".',
    },
  },
  defaultOptions: [],
  create(context) {
    function checkAttributeValue(node: any, attrValue: string) {
      const matches = findVerboseClasses(attrValue)
      if (!matches.length)
        return
      for (const { match, replacement } of matches) {
        context.report({
          node,
          messageId: 'preferShorthand',
          data: { verbose: match, shorthand: replacement },
          fix(fixer) {
            const sourceCode = context.sourceCode
            const text = sourceCode.getText(node)
            return fixer.replaceText(node, text.replace(match, replacement))
          },
        })
      }
    }

    function checkVueAttribute(attr: any) {
      if (!attr.value)
        return
      // Static class attribute: class="text-[var(--ui-text)]"
      if (attr.directive === false && attr.key?.name === 'class') {
        checkAttributeValue(attr, attr.value.value)
        return
      }
      // :class binding — check string literals in the expression
      if (attr.directive && attr.key?.argument?.name === 'class') {
        checkStringLiterals(attr.value?.expression)
      }
    }

    function checkStringLiterals(node: any) {
      if (!node)
        return
      if (node.type === 'Literal' && typeof node.value === 'string') {
        checkAttributeValue(node, node.value)
        return
      }
      if (node.type === 'TemplateLiteral') {
        for (const quasi of node.quasis || []) {
          if (quasi.value?.raw) {
            const matches = findVerboseClasses(quasi.value.raw)
            if (matches.length) {
              for (const { match, replacement } of matches) {
                context.report({
                  node: quasi,
                  messageId: 'preferShorthand',
                  data: { verbose: match, shorthand: replacement },
                  fix(fixer) {
                    const text = context.sourceCode.getText(quasi)
                    return fixer.replaceText(quasi, text.replace(match, replacement))
                  },
                })
              }
            }
          }
        }
        return
      }
      // Recurse into expressions
      if (node.type === 'ConditionalExpression') {
        checkStringLiterals(node.consequent)
        checkStringLiterals(node.alternate)
      }
      if (node.type === 'ArrayExpression') {
        for (const el of node.elements)
          checkStringLiterals(el)
      }
      if (node.type === 'ObjectExpression') {
        for (const prop of node.properties) {
          if (prop.key)
            checkStringLiterals(prop.key)
        }
      }
      if (node.type === 'BinaryExpression' && node.operator === '+') {
        checkStringLiterals(node.left)
        checkStringLiterals(node.right)
      }
    }

    if (isVueParser(context as any)) {
      return defineTemplateBodyVisitor(context, {
        VAttribute(node: any) {
          checkVueAttribute(node)
        },
      }, {
        // Also check script string literals (e.g. in render functions, composables)
        Literal(node: any) {
          if (typeof node.value === 'string') {
            checkAttributeValue(node, node.value)
          }
        },
        TemplateLiteral(node: any) {
          for (const quasi of node.quasis || []) {
            if (quasi.value?.raw) {
              const matches = findVerboseClasses(quasi.value.raw)
              for (const { match, replacement } of matches) {
                context.report({
                  node: quasi,
                  messageId: 'preferShorthand',
                  data: { verbose: match, shorthand: replacement },
                  fix(fixer) {
                    const text = context.sourceCode.getText(quasi)
                    return fixer.replaceText(quasi, text.replace(match, replacement))
                  },
                })
              }
            }
          }
        },
      })
    }

    // JSX / TS fallback
    return {
      Literal(node: any) {
        if (typeof node.value === 'string') {
          checkAttributeValue(node, node.value)
        }
      },
      TemplateLiteral(node: any) {
        for (const quasi of node.quasis || []) {
          if (quasi.value?.raw) {
            const matches = findVerboseClasses(quasi.value.raw)
            for (const { match, replacement } of matches) {
              context.report({
                node: quasi,
                messageId: 'preferShorthand',
                data: { verbose: match, shorthand: replacement },
                fix(fixer) {
                  const text = context.sourceCode.getText(quasi)
                  return fixer.replaceText(quasi, text.replace(match, replacement))
                },
              })
            }
          }
        }
      },
    }
  },
})
