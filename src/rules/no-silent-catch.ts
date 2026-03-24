import type { TSESTree } from '@typescript-eslint/utils'
import { createEslintRule } from '../utils'

export const RULE_NAME = 'no-silent-catch'
export type MessageIds = 'noSilentCatch' | 'noSilentTryCatch'
export type Options = []

function isEmptyOrVoid(node: TSESTree.CallExpressionArgument): boolean {
  // () => {}
  if (node.type === 'ArrowFunctionExpression') {
    if (node.body.type === 'BlockStatement' && node.body.body.length === 0)
      return true
    // () => undefined, () => void 0
    if (node.body.type === 'Identifier' && node.body.name === 'undefined')
      return true
    if (node.body.type === 'UnaryExpression' && node.body.operator === 'void')
      return true
    return false
  }
  // function() {} or function(_e) {}
  if (node.type === 'FunctionExpression') {
    return node.body.body.length === 0
  }
  return false
}

function hasOnlyComments(node: TSESTree.BlockStatement, sourceCode: { getCommentsInside: (node: TSESTree.Node) => TSESTree.Comment[] }): boolean {
  return node.body.length === 0 && sourceCode.getCommentsInside(node).length > 0
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow silently swallowing errors in .catch() or try/catch',
    },
    schema: [],
    messages: {
      noSilentCatch: '.catch() handler silently swallows errors. Handle the error or add a comment explaining why it is safe to ignore.',
      noSilentTryCatch: 'Empty catch block silently swallows errors. Handle the error or add a comment explaining why it is safe to ignore.',
    },
  },
  defaultOptions: [],
  create: (context) => {
    const sourceCode = context.sourceCode ?? context.getSourceCode()
    return {
      // .catch(() => {}) / .catch(function() {})
      CallExpression(node) {
        if (
          node.callee.type !== 'MemberExpression'
          || node.callee.property.type !== 'Identifier'
          || node.callee.property.name !== 'catch'
        ) {
          return
        }

        const handler = node.arguments[0]
        if (!handler)
          return

        if (isEmptyOrVoid(handler)) {
          context.report({ node, messageId: 'noSilentCatch' })
        }
      },
      // try { ... } catch(e) {}
      CatchClause(node) {
        if (node.body.body.length === 0 && !hasOnlyComments(node.body, sourceCode as any)) {
          context.report({ node, messageId: 'noSilentTryCatch' })
        }
      },
    }
  },
})
