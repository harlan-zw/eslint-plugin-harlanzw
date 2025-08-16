import type { TSESTree } from '@typescript-eslint/utils'
import type { VueTemplateListener } from '../vue-utils'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isInVueTemplateString, isRefCall, isVueParser } from '../vue-utils'

export const RULE_NAME = 'vue-no-ref-access-in-templates'
export type MessageIds = 'noRefAccessInTemplate'
export type Options = []

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow accessing ref.value in Vue templates',
    },
    fixable: undefined,
    schema: [],
    messages: {
      noRefAccessInTemplate: 'Avoid unpacking refs in templates for cleaner separation of reactivity.',
    },
  },
  defaultOptions: [],
  create: (context) => {
    const refVariables = new Set<string>()
    const objectRefs = new Map<string, Set<string>>() // object -> set of ref properties

    function isRefAccess(node: TSESTree.MemberExpression): boolean {
      // Direct ref access: refVariable.value
      if (node.object.type === 'Identifier'
        && refVariables.has(node.object.name)
        && node.property.type === 'Identifier'
        && node.property.name === 'value') {
        return true
      }

      // Object property ref access: object.refProperty.value
      if (node.object.type === 'MemberExpression'
        && node.object.object.type === 'Identifier'
        && node.object.property.type === 'Identifier'
        && node.property.type === 'Identifier'
        && node.property.name === 'value') {
        const objectName = node.object.object.name
        const propertyName = node.object.property.name
        const objectRefProperties = objectRefs.get(objectName)
        return objectRefProperties?.has(propertyName) || false
      }

      return false
    }

    // Use vue-eslint-parser's defineTemplateBodyVisitor if available
    if (isVueParser(context as any)) {
      const scriptVisitor: any = {
        Program() {
          refVariables.clear()
          objectRefs.clear()
        },

        VariableDeclarator(node: any) {
          if (node.init?.type === 'CallExpression' && isRefCall(node.init)) {
            if (node.id.type === 'Identifier') {
              refVariables.add(node.id.name)
            }
          }

          if (node.init?.type === 'ObjectExpression' && node.id.type === 'Identifier') {
            const objectName = node.id.name
            const refProperties = new Set<string>()

            for (const property of node.init.properties) {
              if (property.type === 'Property'
                && property.key.type === 'Identifier'
                && property.value.type === 'CallExpression'
                && isRefCall(property.value)) {
                refProperties.add(property.key.name)
              }
            }

            if (refProperties.size > 0) {
              objectRefs.set(objectName, refProperties)
            }
          }
        },

        MemberExpression(node: any) {
          if (isInVueTemplateString(node) && isRefAccess(node)) {
            context.report({
              node,
              messageId: 'noRefAccessInTemplate',
            })
          }
        },
      }

      const templateVisitor: VueTemplateListener = {
        MemberExpression(node: any) {
          if (isRefAccess(node)) {
            context.report({
              node,
              messageId: 'noRefAccessInTemplate',
            })
          }
        },
      }

      return defineTemplateBodyVisitor(context, templateVisitor, scriptVisitor)
    }

    // Fallback for non-Vue files or when Vue parser services are not available
    return {
      Program() {
        refVariables.clear()
        objectRefs.clear()
      },

      VariableDeclarator(node: any) {
        if (node.init?.type === 'CallExpression' && isRefCall(node.init)) {
          if (node.id.type === 'Identifier') {
            refVariables.add(node.id.name)
          }
        }

        if (node.init?.type === 'ObjectExpression' && node.id.type === 'Identifier') {
          const objectName = node.id.name
          const refProperties = new Set<string>()

          for (const property of node.init.properties) {
            if (property.type === 'Property'
              && property.key.type === 'Identifier'
              && property.value.type === 'CallExpression'
              && isRefCall(property.value)) {
              refProperties.add(property.key.name)
            }
          }

          if (refProperties.size > 0) {
            objectRefs.set(objectName, refProperties)
          }
        }
      },

      MemberExpression(node: any) {
        if (isInVueTemplateString(node) && isRefAccess(node)) {
          context.report({
            node,
            messageId: 'noRefAccessInTemplate',
          })
        }
      },
    }
  },
})
