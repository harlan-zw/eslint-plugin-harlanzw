import type { TSESTree } from '@typescript-eslint/utils'
import { createEslintRule } from '../utils'

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
    fixable: null,
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

    function checkToRefsCall(node: TSESTree.CallExpression): void {
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

    return {
      Program() {
        propsVariables.clear()
      },

      // Track variables assigned from defineProps()
      VariableDeclarator(node) {
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
      CallExpression(node) {
        checkToRefsCall(node)
      },
    }
  },
})
