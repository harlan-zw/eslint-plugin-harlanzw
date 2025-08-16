import type { TSESTree } from '@typescript-eslint/utils'
import type { Rule } from 'eslint'
import { createEslintRule } from '../utils'

interface VExpressionContainer {
  type: 'VExpressionContainer'
  expression: TSESTree.Expression | null
  parent: any
}

interface VueNode extends TSESTree.Node {
  type: string
}

type VueTemplateListener = Record<string, any>

// Taken directly from eslint-plugin-vue
function defineTemplateBodyVisitor(
  context: Rule.RuleContext,
  templateVisitor: VueTemplateListener,
  scriptVisitor?: Rule.RuleListener,
) {
  const parserServices = getParserServices(context)
  if (!parserServices?.defineTemplateBodyVisitor) {
    return {}
  }
  return parserServices.defineTemplateBodyVisitor(
    templateVisitor,
    scriptVisitor,
  )
}

/**
 * This function is API compatible with eslint v8.x and eslint v9 or later.
 * @see https://eslint.org/blog/2023/09/preparing-custom-rules-eslint-v9/#from-context-to-sourcecode
 */
function getParserServices(context: Rule.RuleContext) {
  const legacy = context.sourceCode

  return legacy ? legacy.parserServices : context.parserServices
}

export function isVueParser(context: Rule.RuleContext) {
  const parserServices = getParserServices(context)
  return !!parserServices?.defineTemplateBodyVisitor
}

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
    fixable: null,
    schema: [],
    messages: {
      noRefAccessInTemplate: 'Avoid unpacking refs in templates for cleaner separation of reactivity.',
    },
  },
  defaultOptions: [],
  create: (context) => {
    const refVariables = new Set<string>()
    const objectRefs = new Map<string, Set<string>>() // object -> set of ref properties
    function isRefCall(node: TSESTree.CallExpression): boolean {
      return node.callee.type === 'Identifier' && node.callee.name === 'ref'
    }

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

    function isInVueTemplateString(node: TSESTree.Node): boolean {
      let parent = node.parent
      while (parent) {
        if (parent.type === 'TemplateLiteral') {
          // Check if this template literal is likely a Vue template
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

    // Use vue-eslint-parser's defineTemplateBodyVisitor if available
    if (isVueParser(context)) {
      const scriptVisitor = {
        Program() {
          refVariables.clear()
          objectRefs.clear()
        },

        VariableDeclarator(node: TSESTree.VariableDeclarator) {
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

        MemberExpression(node: TSESTree.MemberExpression) {
          if (isInVueTemplateString(node) && isRefAccess(node)) {
            context.report({
              node,
              messageId: 'noRefAccessInTemplate',
            })
          }
        },
      }

      const templateVisitor = {
        MemberExpression(node: TSESTree.MemberExpression) {
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

      VariableDeclarator(node: TSESTree.VariableDeclarator) {
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

      MemberExpression(node: TSESTree.MemberExpression) {
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
