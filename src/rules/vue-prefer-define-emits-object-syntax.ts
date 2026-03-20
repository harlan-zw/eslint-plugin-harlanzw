import type { TSESTree } from '@typescript-eslint/utils'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'vue-prefer-define-emits-object-syntax'
export type MessageIds = 'preferObjectSyntax'
export type Options = []

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'prefer Vue 3.3+ object syntax for defineEmits over call signature style',
    },
    schema: [],
    messages: {
      preferObjectSyntax: 'Use Vue 3.3+ object syntax for defineEmits instead of call signatures. e.g. `defineEmits<{ click: [payload: MouseEvent] }>()`',
    },
  },
  defaultOptions: [],
  create: (context) => {
    function checkCall(node: any): void {
      if (node.callee?.type !== 'Identifier' || node.callee.name !== 'defineEmits')
        return

      const typeArgs = node.typeArguments ?? node.typeParameters
      if (!typeArgs || typeArgs.params.length === 0)
        return

      const typeParam = typeArgs.params[0] as TSESTree.TypeNode
      if (typeParam.type !== 'TSTypeLiteral')
        return

      const hasCallSignature = (typeParam as TSESTree.TSTypeLiteral).members.some(
        m => m.type === 'TSCallSignatureDeclaration',
      )

      if (hasCallSignature) {
        context.report({
          node: typeParam,
          messageId: 'preferObjectSyntax',
        })
      }
    }

    const scriptVisitor = {
      CallExpression: checkCall,
    }

    if (isVueParser(context)) {
      return defineTemplateBodyVisitor(context, {}, scriptVisitor)
    }

    return scriptVisitor
  },
})
