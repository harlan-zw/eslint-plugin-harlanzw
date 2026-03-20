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
    fixable: 'code',
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
          fix(fixer) {
            const sourceCode = context.sourceCode ?? context.getSourceCode()
            const typeLiteral = typeParam as TSESTree.TSTypeLiteral
            const entries: string[] = []

            for (const member of typeLiteral.members) {
              if (member.type === 'TSCallSignatureDeclaration') {
                const params = member.params
                if (params.length === 0)
                  continue

                const firstParam = params[0]
                // Extract event name from first param's type annotation
                const annotation = firstParam.typeAnnotation?.typeAnnotation
                if (!annotation || annotation.type !== 'TSLiteralType' || annotation.literal.type !== 'Literal')
                  return null // bail if we can't determine event name

                const eventName = String(annotation.literal.value)
                const payloadParams = params.slice(1)

                if (payloadParams.length === 0) {
                  entries.push(`${eventName}: []`)
                }
                else {
                  const payloadParts = payloadParams.map(p => sourceCode.getText(p as any))
                  entries.push(`${eventName}: [${payloadParts.join(', ')}]`)
                }
              }
              else {
                // Preserve non-call-signature members as-is
                entries.push(sourceCode.getText(member as any))
              }
            }

            const indent = '  '
            const replacement = `{\n${entries.map(e => `${indent}${e}`).join('\n')}\n}`
            return fixer.replaceText(typeParam as any, replacement)
          },
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
