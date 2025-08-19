import { isAwaited, isFunctionCall, isInFunction, isReturned } from '../ast-utils'
import { createEslintRule } from '../utils'
import { isInVueScriptSetup } from '../vue-utils'

export const RULE_NAME = 'nuxt-await-navigate-to'
export type MessageIds = 'mustAwaitNavigateTo' | 'mustAwaitOrReturnNavigateTo'
export type Options = []

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'enforce that navigateTo() calls are properly awaited or returned',
    },
    schema: [],
    messages: {
      mustAwaitNavigateTo: 'navigateTo() must be awaited in Vue script setup',
      mustAwaitOrReturnNavigateTo: 'navigateTo() must be awaited or returned in functions',
    },
  },
  defaultOptions: [],
  create: (context) => {
    return {
      CallExpression(node) {
        if (!isFunctionCall(node, 'navigateTo')) {
          return
        }

        const inFunction = isInFunction(node)
        const inVueScriptSetup = isInVueScriptSetup(node)

        if (inVueScriptSetup && !inFunction) {
          // Top level in Vue script setup - must be awaited
          if (!isAwaited(node)) {
            context.report({
              node,
              messageId: 'mustAwaitNavigateTo',
            })
          }
        }
        else if (inFunction) {
          // Inside a function - must be awaited or returned
          if (!isAwaited(node) && !isReturned(node)) {
            context.report({
              node,
              messageId: 'mustAwaitOrReturnNavigateTo',
            })
          }
        }
      },
    }
  },
})
