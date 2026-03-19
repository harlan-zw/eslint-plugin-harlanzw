import { createEslintRule } from '../utils'

export const RULE_NAME = 'vue-no-async-lifecycle-hook'
export type MessageIds = 'noAsyncLifecycleHook'
export type Options = []

const LIFECYCLE_HOOKS = new Set([
  'onBeforeMount',
  'onMounted',
  'onBeforeUnmount',
  'onUnmounted',
  'onBeforeUpdate',
  'onUpdated',
  'onActivated',
  'onDeactivated',
  'onErrorCaptured',
  'onRenderTracked',
  'onRenderTriggered',
  // Note: onServerPrefetch is intentionally excluded — Vue awaits it
])

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow async callbacks in Vue lifecycle hooks — code after await runs as a detached microtask that Vue does not await',
    },
    schema: [],
    messages: {
      noAsyncLifecycleHook: '{{hook}}() with an async callback is unsafe — Vue does not await lifecycle callbacks, so code after await runs as a detached microtask that may not execute during the lifecycle phase.',
    },
  },
  defaultOptions: [],
  create: (context) => {
    return {
      CallExpression(node) {
        if (node.callee.type !== 'Identifier')
          return
        const hook = node.callee.name
        if (!LIFECYCLE_HOOKS.has(hook))
          return

        const callback = node.arguments[0]
        if (!callback)
          return

        if (
          (callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression')
          && callback.async
        ) {
          context.report({
            node,
            messageId: 'noAsyncLifecycleHook',
            data: { hook },
          })
        }
      },
    }
  },
})
