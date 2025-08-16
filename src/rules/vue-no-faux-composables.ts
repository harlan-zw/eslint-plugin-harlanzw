import type { TSESTree } from '@typescript-eslint/utils'
import { createEslintRule } from '../utils'

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
    fixable: null,
    schema: [],
    messages: {
      mustUseReactivity: 'Functions starting with use must implement reactivity APIs (use*, ref, reactive, computed, watch, etc.)',
    },
  },
  defaultOptions: [],
  create: (context) => {
    const reactivityAPIs = new Set([
      // Core reactivity
      'ref',
      'reactive',
      'computed',
      'watch',
      'watchEffect',
      'readonly',
      'watchPostEffect',
      'watchSyncEffect',
      'onWatcherCleanup',
      // Shallow variants
      'shallowRef',
      'shallowReactive',
      'shallowReadonly',
      // Utilities
      'toRef',
      'toRefs',
      'unref',
      'toRaw',
      'markRaw',
      // Type checking
      'isRef',
      'isReactive',
      'isReadonly',
      // Advanced
      'customRef',
      'triggerRef',
      'effectScope',
      'getCurrentScope',
      'onScopeDispose',
    ])

    const vueImports = new Set<string>()
    const composableFunctions = new Map<string, TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression>()

    function hasReactivityInStatement(stmt: TSESTree.Statement): boolean {
      if (!stmt)
        return false

      switch (stmt.type) {
        case 'ExpressionStatement':
          return hasReactivityInExpression(stmt.expression)
        case 'VariableDeclaration':
          return stmt.declarations.some(decl =>
            hasReactivityInExpression(decl.init))
        case 'ReturnStatement':
          return hasReactivityInExpression(stmt.argument)
        case 'BlockStatement':
          return stmt.body.some(s => hasReactivityInStatement(s))
        case 'IfStatement':
          return hasReactivityInStatement(stmt.consequent)
            || (stmt.alternate ? hasReactivityInStatement(stmt.alternate) : false)
        case 'WhileStatement':
        case 'DoWhileStatement':
          return hasReactivityInStatement(stmt.body)
        case 'ForStatement':
        case 'ForInStatement':
        case 'ForOfStatement':
          return hasReactivityInStatement(stmt.body)
        case 'TryStatement':
          return hasReactivityInStatement(stmt.block)
            || (stmt.handler ? hasReactivityInStatement(stmt.handler.body) : false)
            || (stmt.finalizer ? hasReactivityInStatement(stmt.finalizer) : false)
        case 'SwitchStatement':
          return stmt.cases.some(switchCase =>
            switchCase.consequent.some(s => hasReactivityInStatement(s)))
        default:
          return false
      }
    }

    function hasReactivityInExpression(expr: TSESTree.Expression | null): boolean {
      if (!expr)
        return false

      switch (expr.type) {
        case 'CallExpression':
          if (expr.callee.type === 'Identifier') {
            // Check if it's a Vue reactivity API
            if (reactivityAPIs.has(expr.callee.name) && vueImports.has(expr.callee.name))
              return true
            // Check if it's calling another composable (starts with 'use' followed by capital letter or underscore)
            if (/^use[A-Z_]/.test(expr.callee.name))
              return true
          }
          return false
        case 'ObjectExpression':
          return expr.properties.some(prop =>
            prop.type === 'Property' && hasReactivityInExpression(prop.value as TSESTree.Expression))
        case 'ArrayExpression':
          return expr.elements.some(elem =>
            hasReactivityInExpression(elem as TSESTree.Expression))
        default:
          return false
      }
    }

    function checkFunctionForReactivity(functionNode: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression, functionName: string): void {
      if (!functionNode.body || functionNode.body.type !== 'BlockStatement')
        return

      const hasReactivity = functionNode.body.body.some(stmt =>
        hasReactivityInStatement(stmt))

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
        composableFunctions.clear()
      },

      ImportDeclaration(node) {
        if (node.source.value === 'vue') {
          node.specifiers.forEach((spec) => {
            if (spec.type === 'ImportSpecifier')
              vueImports.add(spec.imported.name)
          })
        }
      },

      'Program:exit': function () {
        for (const [name, functionNode] of composableFunctions)
          checkFunctionForReactivity(functionNode, name)
      },

      FunctionDeclaration(node) {
        if (node.id && /^use[A-Z_]/.test(node.id.name))
          composableFunctions.set(node.id.name, node)
      },

      VariableDeclarator(node) {
        if (node.id.type === 'Identifier'
          && /^use[A-Z_]/.test(node.id.name)
          && (node.init?.type === 'FunctionExpression'
            || node.init?.type === 'ArrowFunctionExpression')) {
          composableFunctions.set(node.id.name, node.init)
        }
      },

      ExportNamedDeclaration(node) {
        if (node.declaration?.type === 'FunctionDeclaration'
          && node.declaration.id && /^use[A-Z_]/.test(node.declaration.id.name)) {
          composableFunctions.set(node.declaration.id.name, node.declaration)
        }
      },
    }
  },
})
