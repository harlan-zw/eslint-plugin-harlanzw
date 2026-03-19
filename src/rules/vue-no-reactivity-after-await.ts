import type { TSESTree } from '@typescript-eslint/utils'
import { createEslintRule } from '../utils'

export const RULE_NAME = 'vue-no-reactivity-after-await'
export type MessageIds = 'noReactivityAfterAwait'
export type Options = []

// APIs that create subscriptions tied to the component instance
const SUBSCRIPTION_APIS = new Set([
  // Vue watchers
  'watch',
  'watchEffect',
  'watchPostEffect',
  'watchSyncEffect',
  // Vue computed
  'computed',
  // VueUse watchers
  'whenever',
  'watchArray',
  'watchAtMost',
  'watchDebounced',
  'watchDeep',
  'watchIgnorable',
  'watchImmediate',
  'watchOnce',
  'watchPausable',
  'watchThrottled',
  'watchTriggerable',
  'watchWithFilter',
  'debouncedWatch',
  'throttledWatch',
  // VueUse computed
  'computedAsync',
  'computedEager',
  'computedInject',
  'computedWithControl',
  'reactiveComputed',
])

function getEnclosingAsyncFunction(node: TSESTree.Node): TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression | null {
  let parent: TSESTree.Node | undefined = node.parent
  while (parent) {
    if (
      parent.type === 'FunctionDeclaration'
      || parent.type === 'FunctionExpression'
      || parent.type === 'ArrowFunctionExpression'
    ) {
      return parent.async ? parent : null
    }
    parent = parent.parent
  }
  return null
}

function hasAwaitBefore(callNode: TSESTree.CallExpression, asyncFn: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression): boolean {
  const body = asyncFn.body
  if (body.type !== 'BlockStatement')
    return false

  const callStart = callNode.range[0]
  let found = false

  function walkStatements(stmts: TSESTree.Statement[]): void {
    for (const stmt of stmts) {
      if (found)
        return
      walkNode(stmt)
    }
  }

  function walkNode(node: TSESTree.Node): void {
    if (found)
      return

    // If this node starts after our call, skip
    if (node.range[0] >= callStart)
      return

    if (node.type === 'AwaitExpression') {
      found = true
      return
    }

    // Don't descend into nested functions — their awaits don't count
    if (
      node.type === 'FunctionDeclaration'
      || node.type === 'FunctionExpression'
      || node.type === 'ArrowFunctionExpression'
    ) {
      return
    }

    // Walk children
    for (const key of Object.keys(node)) {
      if (key === 'parent')
        continue
      const child = (node as any)[key]
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item.type === 'string')
              walkNode(item)
          }
        }
        else if (typeof child.type === 'string') {
          walkNode(child)
        }
      }
    }
  }

  walkStatements(body.body)
  return found
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow Vue subscription APIs (watch, computed, etc.) after await in async functions — they lose component instance context and become orphaned',
    },
    schema: [],
    messages: {
      noReactivityAfterAwait: '{{name}}() called after await loses Vue component instance context and will never be auto-stopped on unmount. Move it before any await or wrap in effectScope().',
    },
  },
  defaultOptions: [],
  create: (context) => {
    return {
      CallExpression(node) {
        if (node.callee.type !== 'Identifier')
          return
        const name = node.callee.name
        if (!SUBSCRIPTION_APIS.has(name))
          return

        const asyncFn = getEnclosingAsyncFunction(node)
        if (!asyncFn)
          return

        if (hasAwaitBefore(node, asyncFn)) {
          context.report({
            node,
            messageId: 'noReactivityAfterAwait',
            data: { name },
          })
        }
      },
    }
  },
})
