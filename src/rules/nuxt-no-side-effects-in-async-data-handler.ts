import type { TSESTree } from '@typescript-eslint/utils'
import { findContainingStatement, getStatementIndentation } from '../ast-utils'
import { createEslintRule } from '../utils'

export const RULE_NAME = 'nuxt-no-side-effects-in-async-data-handler'
export type MessageIds = 'noSideEffectsInAsyncDataHandler' | 'useCallOnceForSideEffects'
export type Options = []

/**
 * Side effect patterns that should be avoided in useAsyncData/useFetch handlers
 */
const SIDE_EFFECT_PATTERNS = new Set([
  // Store/State mutations
  '$patch',
  '$state',
  '$subscribe',
  '$onAction',
  '$dispose',
  'useState',
  'updateState',
  'mutateState',

  // Navigation
  'navigateTo',
  'push',
  'replace',
  'go',
  'back',
  'forward',

  // DOM manipulation
  'getElementById',
  'querySelector',
  'querySelectorAll',
  'createElement',
  'appendChild',
  'removeChild',
  'setAttribute',
  'classList',

  // Global assignments (detected via assignment patterns)
  // These will be handled separately

  // Analytics/Tracking
  'gtag',
  'fbq',
  'analytics',
  'track',
  'identify',
  'page',

  // Logging (debatable - may allow console methods)
  'console',

  // Timer/Animation functions
  'setTimeout',
  'setInterval',
  'requestAnimationFrame',
  'requestIdleCallback',
])

/**
 * Function names that indicate async data handlers
 */
const ASYNC_DATA_FUNCTIONS = new Set([
  'useAsyncData',
  'useFetch',
  'useLazyFetch',
  'useLazyAsyncData',
])

function isAsyncDataCall(node: TSESTree.CallExpression): boolean {
  return node.callee.type === 'Identifier' && ASYNC_DATA_FUNCTIONS.has(node.callee.name)
}

function isSideEffectInHandler(node: TSESTree.Node): boolean {
  // Check for function calls that are side effects
  if (node.type === 'CallExpression') {
    if (node.callee.type === 'Identifier') {
      return SIDE_EFFECT_PATTERNS.has(node.callee.name)
    }
    // Check for member expressions like store.$patch(), console.log()
    if (node.callee.type === 'MemberExpression') {
      if (node.callee.property.type === 'Identifier') {
        if (SIDE_EFFECT_PATTERNS.has(node.callee.property.name)) {
          return true
        }
      }
      // Check for object.method patterns where object is a side effect
      if (node.callee.object.type === 'Identifier') {
        return SIDE_EFFECT_PATTERNS.has(node.callee.object.name)
      }
    }
  }

  // Check for assignment expressions (global variable assignments)
  if (node.type === 'AssignmentExpression') {
    // Allow local variable assignments, but flag potential global assignments
    if (node.left.type === 'MemberExpression') {
      return true // Any property assignment could be a side effect
    }
  }

  return false
}

function findSideEffectsInFunction(functionNode: TSESTree.Function): TSESTree.Node[] {
  const sideEffects: TSESTree.Node[] = []

  function visit(node: TSESTree.Node) {
    if (isSideEffectInHandler(node)) {
      sideEffects.push(node)
    }

    // Recursively check child nodes, but don't go into nested functions
    for (const [key, child] of Object.entries(node)) {
      if (key === 'parent' || child === null || child === undefined)
        continue

      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === 'object' && 'type' in item) {
            // Skip nested functions - side effects in nested functions are allowed
            if (item.type === 'FunctionExpression'
              || item.type === 'ArrowFunctionExpression'
              || item.type === 'FunctionDeclaration') {
              continue
            }
            visit(item as TSESTree.Node)
          }
        }
      }
      else if (child && typeof child === 'object' && 'type' in child) {
        // Skip nested functions
        if (child.type === 'FunctionExpression'
          || child.type === 'ArrowFunctionExpression'
          || child.type === 'FunctionDeclaration') {
          continue
        }
        visit(child as TSESTree.Node)
      }
    }
  }

  if (functionNode.body) {
    visit(functionNode.body)
  }

  return sideEffects
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'enforce that useAsyncData/useFetch handlers are side-effect free to ensure predictable SSR/CSR behavior',
    },
    fixable: 'code',
    schema: [],
    messages: {
      noSideEffectsInAsyncDataHandler: 'Handler functions in {{functionName}} should be side-effect free to ensure predictable behavior during SSR and CSR hydration. Move side effects outside the handler.',
      useCallOnceForSideEffects: 'If you need to trigger side effects, use the callOnce utility instead of putting them in the handler function.',
    },
  },
  defaultOptions: [],
  create: (context) => {
    return {
      CallExpression(node) {
        // Only check useAsyncData/useFetch calls
        if (!isAsyncDataCall(node)) {
          return
        }

        // Find the handler function (usually the second argument, but could be first)
        let handlerArg: TSESTree.Expression | null = null

        if (node.arguments.length >= 2) {
          // Pattern: useAsyncData('key', handler)
          handlerArg = node.arguments[1]
        }
        else if (node.arguments.length === 1) {
          // Pattern: useAsyncData(handler) - key is auto-generated
          handlerArg = node.arguments[0]
        }

        if (!handlerArg)
          return

        // Check if the handler is a function
        let handlerFunction: TSESTree.Function | null = null

        if (handlerArg.type === 'FunctionExpression' || handlerArg.type === 'ArrowFunctionExpression') {
          handlerFunction = handlerArg
        }

        if (!handlerFunction)
          return

        // Look for side effects in the handler function
        const sideEffects = findSideEffectsInFunction(handlerFunction)

        if (sideEffects.length > 0) {
          const functionName = node.callee.type === 'Identifier' ? node.callee.name : 'unknown'

          // Report each side effect
          sideEffects.forEach((sideEffect) => {
            context.report({
              node: sideEffect,
              messageId: 'noSideEffectsInAsyncDataHandler',
              data: {
                functionName,
              },
            })
          })

          // Also report on the main function call with auto-fix
          context.report({
            node,
            messageId: 'useCallOnceForSideEffects',
            fix(fixer) {
              const sourceCode = context.getSourceCode()
              const statement = findContainingStatement(node)
              const statementText = sourceCode.getText(statement)
              const indent = getStatementIndentation(statement, sourceCode)

              // Extract side effect statements from the handler
              const sideEffectStatements: string[] = []
              sideEffects.forEach((sideEffect) => {
                const sideEffectStatement = findContainingStatement(sideEffect)
                const sideEffectText = sourceCode.getText(sideEffectStatement)
                sideEffectStatements.push(sideEffectText)
              })

              // Generate callOnce block with side effects
              const callOnceBlock = `callOnce(async () => {
${indent}  ${sideEffectStatements.join(`\n${indent}  `)}
${indent}})`

              // Create a new handler without side effects
              const handlerFunction = handlerArg
              if (handlerFunction && (handlerFunction.type === 'FunctionExpression' || handlerFunction.type === 'ArrowFunctionExpression')) {
                const handlerText = sourceCode.getText(handlerFunction)

                // Remove side effect statements from handler
                let cleanHandlerText = handlerText
                sideEffects.forEach((sideEffect) => {
                  const sideEffectStatement = findContainingStatement(sideEffect)
                  const sideEffectText = sourceCode.getText(sideEffectStatement)
                  cleanHandlerText = cleanHandlerText.replace(sideEffectText, '')
                })

                // Clean up extra whitespace and empty lines
                cleanHandlerText = cleanHandlerText.replace(/\n\s*\n\s*\n/g, '\n\n').trim()

                const newStatement = statementText.replace(handlerText, cleanHandlerText)

                return [
                  fixer.replaceText(statement, newStatement),
                  fixer.insertTextAfter(statement, `\n\n${indent}${callOnceBlock}`),
                ]
              }

              return null
            },
          })
        }
      },
    }
  },
})
