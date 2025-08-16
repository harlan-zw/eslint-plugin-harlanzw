import type { TSESTree } from '@typescript-eslint/utils'
import { createEslintRule } from '../utils'

export const RULE_NAME = 'vue-no-passing-refs-as-props'
export type MessageIds = 'noPassingRefsAsProps'
export type Options = []

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow passing refs as props to Vue components',
    },
    fixable: null,
    schema: [],
    messages: {
      noPassingRefsAsProps: 'Avoid passing refs as props. Pass the unwrapped value using ref.value or use reactive() instead.',
    },
  },
  defaultOptions: [],
  create: (context) => {
    const refProperties = new Map<string, Set<string>>() // objectName -> Set of property names that are refs

    function isRefCall(node: TSESTree.CallExpression): boolean {
      return node.callee.type === 'Identifier' && node.callee.name === 'ref'
    }

    function isInVueTemplateString(node: TSESTree.Node): boolean {
      let parent = node.parent
      while (parent) {
        if (parent.type === 'TemplateLiteral') {
          const grandparent = parent.parent
          if (grandparent?.type === 'TaggedTemplateExpression') {
            const tag = grandparent.tag
            if (tag.type === 'Identifier' && tag.name === 'html') {
              return true
            }
          }
        }
        parent = parent.parent
      }
      return false
    }

    function isRefProperty(objectName: string, propertyName: string): boolean {
      const properties = refProperties.get(objectName)
      return properties?.has(propertyName) ?? false
    }

    return {
      Program() {
        refProperties.clear()
      },

      // Track object properties assigned from ref() calls
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier' && node.init?.type === 'ObjectExpression') {
          const objectName = node.id.name
          const objectProperties = new Set<string>()

          for (const property of node.init.properties) {
            if (property.type === 'Property'
              && property.key.type === 'Identifier'
              && property.value.type === 'CallExpression'
              && isRefCall(property.value)) {
              objectProperties.add(property.key.name)
            }
          }

          if (objectProperties.size > 0) {
            refProperties.set(objectName, objectProperties)
          }
        }
      },

      // Check for ref property access in template expressions
      MemberExpression(node) {
        if (isInVueTemplateString(node)
          && node.object.type === 'Identifier'
          && node.property.type === 'Identifier'
          && isRefProperty(node.object.name, node.property.name)) {
          // Check if this is followed by .value access, which would be valid
          const parent = node.parent
          if (parent?.type === 'MemberExpression'
            && parent.property.type === 'Identifier'
            && parent.property.name === 'value') {
            return // Allow foo.bar.value pattern
          }

          context.report({
            node,
            messageId: 'noPassingRefsAsProps',
          })
        }
      },
    }
  },
})
