import type { TSESTree } from '@typescript-eslint/utils'
import { createEslintRule } from '../utils'

export const RULE_NAME = 'no-silent-catch'
export type MessageIds = 'noSilentCatch' | 'noSilentTryCatch'
export type Options = []

interface SourceCodeWithComments {
  getCommentsInside: (node: TSESTree.Node) => TSESTree.Comment[]
}

function isNoopValue(node: TSESTree.Expression | null): boolean {
  return node === null
    || (node.type === 'Identifier' && node.name === 'undefined')
    || (node.type === 'UnaryExpression' && node.operator === 'void')
    || (node.type === 'Literal' && node.value === null)
}

function isSilentBlock(node: TSESTree.BlockStatement, sourceCode: SourceCodeWithComments): boolean {
  if (sourceCode.getCommentsInside(node).length > 0)
    return false
  if (node.body.length === 0)
    return true
  return node.body.length === 1
    && node.body[0].type === 'ReturnStatement'
    && isNoopValue(node.body[0].argument)
}

function isSilentHandler(node: TSESTree.CallExpressionArgument, sourceCode: SourceCodeWithComments): boolean {
  // () => {}
  if (node.type === 'ArrowFunctionExpression') {
    return node.body.type === 'BlockStatement'
      ? isSilentBlock(node.body, sourceCode)
      : isNoopValue(node.body)
  }
  // function() {} or function(_e) {}
  if (node.type === 'FunctionExpression')
    return isSilentBlock(node.body, sourceCode)
  return false
}

function hasOnlyComments(node: TSESTree.BlockStatement, sourceCode: SourceCodeWithComments): boolean {
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

        if (isSilentHandler(handler, sourceCode as SourceCodeWithComments)) {
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
