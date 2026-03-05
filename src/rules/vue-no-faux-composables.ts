import type { TSESTree } from '@typescript-eslint/utils'
import { createEslintRule } from '../utils'
import { createReactivityChecker, isComposableName, trackNonVueImports, trackVueImports } from '../vue-utils'

export const RULE_NAME = 'vue-no-faux-composables'
export type MessageIds = 'mustUseReactivity'
export type Options = []

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'enforce that composables must use Vue reactivity APIs',
    },
    schema: [],
    messages: {
      mustUseReactivity: 'Functions starting with use must implement reactivity APIs (use*, ref, reactive, computed, watch, etc.)',
    },
  },
  defaultOptions: [],
  create: (context) => {
    const filename = context.filename || context.getFilename()
    if (filename.endsWith('.vue'))
      return {}

    const vueImports = new Set<string>()
    const nonVueImports = new Set<string>()
    const composableFunctions = new Map<string, TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression>()

    const { hasReactivityInStatement, hasReactivityInExpression } = createReactivityChecker(vueImports, nonVueImports)

    function checkFunctionForReactivity(functionNode: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression, functionName: string): void {
      if (!functionNode.body)
        return

      let hasReactivity: boolean
      if (functionNode.body.type === 'BlockStatement') {
        hasReactivity = functionNode.body.body.some(stmt => hasReactivityInStatement(stmt))
      }
      else {
        hasReactivity = hasReactivityInExpression(functionNode.body)
      }

      if (!hasReactivity) {
        context.report({
          node: functionNode,
          messageId: 'mustUseReactivity',
          data: { name: functionName },
        })
      }
    }

    return {
      Program() {
        vueImports.clear()
        nonVueImports.clear()
        composableFunctions.clear()
      },

      ImportDeclaration(node) {
        trackVueImports(node, vueImports)
        trackNonVueImports(node, nonVueImports)
      },

      'Program:exit': function () {
        for (const [name, functionNode] of composableFunctions)
          checkFunctionForReactivity(functionNode, name)
      },

      FunctionDeclaration(node) {
        if (node.id && isComposableName(node.id.name))
          composableFunctions.set(node.id.name, node)
      },

      VariableDeclarator(node) {
        if (node.id.type === 'Identifier'
          && isComposableName(node.id.name)
          && (node.init?.type === 'FunctionExpression'
            || node.init?.type === 'ArrowFunctionExpression')) {
          composableFunctions.set(node.id.name, node.init)
        }
      },

      ExportNamedDeclaration(node) {
        if (node.declaration?.type === 'FunctionDeclaration'
          && node.declaration.id && isComposableName(node.declaration.id.name)) {
          composableFunctions.set(node.declaration.id.name, node.declaration)
        }
      },
    }
  },
})
