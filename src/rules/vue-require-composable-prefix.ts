import type { TSESTree } from '@typescript-eslint/utils'
import { createEslintRule } from '../utils'
import { createReactivityChecker, isComposableName, trackNonVueImports, trackVueImports } from '../vue-utils'

export const RULE_NAME = 'vue-require-composable-prefix'
export type MessageIds = 'requirePrefix'
export type Options = []

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce use* prefix for functions that use Vue reactivity',
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      requirePrefix: 'Function "{{name}}" uses Vue reactivity — consider renaming to "use{{Name}}"',
    },
  },
  defaultOptions: [],
  create: (context) => {
    const vueImports = new Set<string>()
    const nonVueImports = new Set<string>()
    const candidateFunctions = new Map<string, {
      node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression
      idNode: TSESTree.Identifier
    }>()

    const { hasReactivityInStatement, hasReactivityInExpression } = createReactivityChecker(vueImports, nonVueImports)

    function isExcludedName(name: string): boolean {
      return /^define[A-Z]/.test(name) || name === 'setup'
    }

    function checkFunctionForReactivity(
      functionNode: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression,
      idNode: TSESTree.Identifier,
      functionName: string,
    ): void {
      if (!functionNode.body)
        return

      let hasReactivity: boolean
      if (functionNode.body.type === 'BlockStatement') {
        hasReactivity = functionNode.body.body.some(stmt => hasReactivityInStatement(stmt))
      }
      else {
        hasReactivity = hasReactivityInExpression(functionNode.body)
      }

      if (hasReactivity) {
        const capitalizedName = `${functionName.charAt(0).toUpperCase()}${functionName.slice(1)}`
        const suggestedName = `use${capitalizedName}`
        context.report({
          node: idNode,
          messageId: 'requirePrefix',
          data: { name: functionName, Name: capitalizedName },
          suggest: [
            {
              messageId: 'requirePrefix',
              data: { name: functionName, Name: capitalizedName },
              fix(fixer) {
                return fixer.replaceText(idNode, suggestedName)
              },
            },
          ],
        })
      }
    }

    return {
      Program() {
        vueImports.clear()
        nonVueImports.clear()
        candidateFunctions.clear()
      },

      ImportDeclaration(node) {
        trackVueImports(node, vueImports)
        trackNonVueImports(node, nonVueImports)
      },

      'Program:exit': function () {
        for (const [name, { node, idNode }] of candidateFunctions)
          checkFunctionForReactivity(node, idNode, name)
      },

      FunctionDeclaration(node) {
        if (!node.id || isComposableName(node.id.name) || isExcludedName(node.id.name))
          return
        if (node.parent.type === 'Program' || node.parent.type === 'ExportNamedDeclaration')
          candidateFunctions.set(node.id.name, { node, idNode: node.id })
      },

      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier'
          || isComposableName(node.id.name)
          || isExcludedName(node.id.name)) {
          return
        }
        if (node.init?.type !== 'FunctionExpression' && node.init?.type !== 'ArrowFunctionExpression')
          return
        const varDecl = node.parent
        if (varDecl?.type !== 'VariableDeclaration')
          return
        if (varDecl.parent?.type !== 'Program' && varDecl.parent?.type !== 'ExportNamedDeclaration')
          return
        candidateFunctions.set(node.id.name, { node: node.init, idNode: node.id })
      },
    }
  },
})
