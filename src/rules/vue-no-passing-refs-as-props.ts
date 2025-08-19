import { isCallExpression, isIdentifier, isMemberExpression, isObjectExpression, isProperty } from '../ast-utils'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isInVueTemplateString, isRefCall, isVueParser } from '../vue-utils'

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
    schema: [],
    messages: {
      noPassingRefsAsProps: 'Avoid passing refs as props. Pass the unwrapped value using ref.value or use reactive() instead.',
    },
  },
  defaultOptions: [],
  create: (context) => {
    const refProperties = new Map<string, Set<string>>() // objectName -> Set of property names that are refs

    function isRefProperty(objectName: string, propertyName: string): boolean {
      const properties = refProperties.get(objectName)
      return properties?.has(propertyName) ?? false
    }

    function checkMemberExpression(node: any) {
      if (isIdentifier(node.object)
        && isIdentifier(node.property)
        && isRefProperty(node.object.name, node.property.name)) {
        // Check if this is followed by .value access, which would be valid
        const parent = node.parent
        if (isMemberExpression(parent)
          && isIdentifier(parent.property)
          && parent.property.name === 'value') {
          return // Allow foo.bar.value pattern
        }

        context.report({
          node,
          messageId: 'noPassingRefsAsProps',
        })
      }
    }

    const scriptVisitor = {
      Program() {
        refProperties.clear()
      },

      // Track object properties assigned from ref() calls
      VariableDeclarator(node: any) {
        if (isIdentifier(node.id) && isObjectExpression(node.init)) {
          const objectName = node.id.name
          const objectProperties = new Set<string>()

          for (const property of node.init.properties) {
            if (isProperty(property)
              && isIdentifier(property.key)
              && isCallExpression(property.value)
              && isRefCall(property.value)) {
              objectProperties.add(property.key.name)
            }
          }

          if (objectProperties.size > 0) {
            refProperties.set(objectName, objectProperties)
          }
        }
      },

      // Check for ref property access in template strings (for non-SFC files)
      MemberExpression(node: any) {
        if (isInVueTemplateString(node)) {
          checkMemberExpression(node)
        }
      },
    }

    // If this is a Vue SFC, use template body visitor
    if (isVueParser(context)) {
      return defineTemplateBodyVisitor(context, {
        // Check for ref property access in Vue SFC templates
        MemberExpression: checkMemberExpression,
      }, scriptVisitor)
    }

    // For non-SFC files, use the script visitor only
    return scriptVisitor
  },
})
