import type { TSESTree } from '@typescript-eslint/utils'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'vue-no-torefs-on-props'
export type MessageIds = 'noToRefsOnProps'
export type Options = []

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow using toRefs on props object in Vue',
    },
    schema: [],
    messages: {
      noToRefsOnProps: 'Using toRefs() on all props can be an antipattern as props are already reactive. Destruct props directory and wrap as refs individually if needed.',
    },
  },
  defaultOptions: [],
  create: (context) => {
    const propsVariables = new Set<string>()

    function isPropsRelated(node: TSESTree.Identifier): boolean {
      return propsVariables.has(node.name)
    }

    function checkToRefsCall(node: any): void {
      // Check if the function being called is 'toRefs'
      if (node.callee.type === 'Identifier' && node.callee.name === 'toRefs') {
        // Check if the argument is a props-related variable
        if (node.arguments.length > 0) {
          const firstArg = node.arguments[0]
          if (firstArg.type === 'Identifier' && isPropsRelated(firstArg)) {
            context.report({
              node,
              messageId: 'noToRefsOnProps',
            })
          }
        }
      }
    }

    const scriptVisitor = {
      Program() {
        propsVariables.clear()
      },

      // Track variables assigned from defineProps()
      VariableDeclarator(node: any) {
        if (node.init?.type === 'CallExpression') {
          const callExpr = node.init
          if (callExpr.callee.type === 'Identifier' && callExpr.callee.name === 'defineProps') {
            if (node.id.type === 'Identifier') {
              propsVariables.add(node.id.name)
            }
          }
        }
      },

      // Check for toRefs calls
      CallExpression(node: any) {
        checkToRefsCall(node)
      },
    }

    const templateVisitor = {
      // Check for toRefs calls in Vue SFC templates
      CallExpression: checkToRefsCall,
    }

    // If this is a Vue SFC, use template body visitor
    if (isVueParser(context)) {
      return defineTemplateBodyVisitor(context, templateVisitor, scriptVisitor)
    }

    // For non-SFC files, use the script visitor only
    return scriptVisitor
  },
})
