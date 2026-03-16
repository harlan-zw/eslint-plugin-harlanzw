import { isAtTopLevel } from '../ast-utils'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'vue-no-resolve-component-in-composables'
export type MessageIds = 'noResolveInComposable' | 'noResolveInNestedScope'
export type Options = []

const RESOLVE_APIS = new Set(['resolveComponent', 'resolveDirective'])

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow resolveComponent/resolveDirective outside top-level script setup',
    },
    schema: [],
    messages: {
      noResolveInComposable: '{{ name }}() relies on an active Vue setup context. Move this call into <script setup> or import the component directly.',
      noResolveInNestedScope: '{{ name }}() must be called at the top level of <script setup>, not inside nested functions or callbacks.',
    },
  },
  defaultOptions: [],
  create(context) {
    function checkCall(node: any, messageId: MessageIds) {
      if (node.callee.type === 'Identifier' && RESOLVE_APIS.has(node.callee.name)) {
        context.report({
          node,
          messageId,
          data: { name: node.callee.name },
        })
      }
    }

    // In .vue files, only allow resolveComponent at top level of script setup
    if (isVueParser(context as any)) {
      return defineTemplateBodyVisitor(context, {}, {
        CallExpression(node: any) {
          if (node.callee.type === 'Identifier' && RESOLVE_APIS.has(node.callee.name)) {
            if (!isAtTopLevel(node)) {
              checkCall(node, 'noResolveInNestedScope')
            }
          }
        },
      })
    }

    // In .ts/.js files, flag any resolveComponent/resolveDirective call
    return {
      CallExpression(node: any) {
        checkCall(node, 'noResolveInComposable')
      },
    }
  },
})
