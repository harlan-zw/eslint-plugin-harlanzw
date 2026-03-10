import type { TSESTree } from '@typescript-eslint/utils'
import { findContainingStatement, getStatementIndentation } from '../ast-utils'
import { createEslintRule } from '../utils'

const REGEX_1 = /\n\s*\n\s*\n/g

export const RULE_NAME = 'nuxt-no-side-effects-in-async-data-handler'
export type MessageIds = 'noSideEffectsInAsyncDataHandler' | 'useCallOnceForSideEffects'
export type Options = []

/**
 * Side effect patterns that should be avoided in useAsyncData/useFetch handlers
 */
/**
 * Side effect method names — always a side effect regardless of receiver
 */
const SIDE_EFFECT_PATTERNS = new Set([
  // Store/State mutations ($ prefix makes these unambiguous)
  '$patch',
  '$state',
  '$subscribe',
  '$onAction',
  '$dispose',

  // Nuxt-specific
  'navigateTo',
  'useState',

  // Analytics/Tracking (direct calls)
  'gtag',
  'fbq',

  // DOM manipulation
  'getElementById',
  'querySelector',
  'querySelectorAll',
  'createElement',
  'appendChild',
  'removeChild',
  'setAttribute',

  // Timer/Animation functions
  'setTimeout',
  'setInterval',
  'requestAnimationFrame',
  'requestIdleCallback',
])

/**
 * Methods that are only side effects when called on specific receivers.
 * Avoids false positives like String.replace(), Array.push(), etc.
 */
const RECEIVER_SCOPED_METHODS: Record<string, Set<string>> = {
  // Navigation — only on router instances
  push: new Set(['router', '$router']),
  replace: new Set(['router', '$router']),
  go: new Set(['router', '$router']),
  back: new Set(['router', '$router']),
  forward: new Set(['router', '$router']),
  // Analytics — only on analytics/tracking objects
  track: new Set(['analytics', 'mixpanel', 'segment']),
  identify: new Set(['analytics', 'mixpanel', 'segment']),
  page: new Set(['analytics', 'mixpanel', 'segment']),
}

/**
 * Receiver objects that are always side-effecting (any method call on them)
 */
const SIDE_EFFECT_RECEIVERS = new Set([
  'console',
  'gtag',
  'fbq',
  'classList',
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
    // Check for member expressions like store.$patch(), console.log(), router.push()
    if (node.callee.type === 'MemberExpression' && node.callee.property.type === 'Identifier') {
      const method = node.callee.property.name

      // Always-side-effect method names (e.g., $patch, getElementById)
      if (SIDE_EFFECT_PATTERNS.has(method))
        return true

      // Receiver-scoped methods (e.g., router.push but NOT array.push)
      const allowedReceivers = RECEIVER_SCOPED_METHODS[method]
      if (allowedReceivers && node.callee.object.type === 'Identifier' && allowedReceivers.has(node.callee.object.name))
        return true

      // Any call on a known side-effect receiver (e.g., console.anything, gtag.anything)
      if (node.callee.object.type === 'Identifier' && SIDE_EFFECT_RECEIVERS.has(node.callee.object.name))
        return true
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

function findSideEffectsInFunction(functionNode: TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration): TSESTree.Node[] {
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

        if (node.arguments.length >= 2 && node.arguments[1].type !== 'SpreadElement') {
          // Pattern: useAsyncData('key', handler)
          handlerArg = node.arguments[1]
        }
        else if (node.arguments.length === 1 && node.arguments[0].type !== 'SpreadElement') {
          // Pattern: useAsyncData(handler) - key is auto-generated
          handlerArg = node.arguments[0]
        }

        if (!handlerArg)
          return

        // Check if the handler is a function
        let handlerFunction: TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | null = null

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
              const sourceCode = context.sourceCode
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
                cleanHandlerText = cleanHandlerText.replace(REGEX_1, '\n\n').trim()

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
