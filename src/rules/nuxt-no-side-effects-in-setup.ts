import { findContainingStatement, getStatementIndentation, isInFunction } from '../ast-utils'
import { createEslintRule } from '../utils'
import { isInVueScriptSetup, isSideEffectCall, SIDE_EFFECT_CLEANUP_MAP, SIDE_EFFECT_FUNCTIONS } from '../vue-utils'

export const RULE_NAME = 'nuxt-no-side-effects-in-setup'
export type MessageIds = 'noSideEffectsInSetup'
export type Options = []

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'enforce that side effects are moved to onMounted to avoid memory leaks during SSR',
    },
    fixable: 'code',
    schema: [],
    messages: {
      noSideEffectsInSetup: 'Side effects like {{functionName}}() should be moved to onMounted() to avoid memory leaks during SSR. The cleanup hooks (onUnmounted) are not called during SSR.',
    },
  },
  defaultOptions: [],
  create: (context) => {
    function reportSideEffect(node: any, functionName: string) {
      context.report({
        node,
        messageId: 'noSideEffectsInSetup',
        data: {
          functionName,
        },
        fix(fixer) {
          const sourceCode = context.getSourceCode()
          const nodeText = sourceCode.getText(node)

          // Find the statement containing this node and get its indentation
          const statement = findContainingStatement(node)
          const indent = getStatementIndentation(statement, sourceCode)

          // Generate appropriate cleanup code based on the function type
          const baseIndent = '  '
          let replacement: string

          if (['setTimeout', 'setInterval', 'requestAnimationFrame', 'requestIdleCallback'].includes(functionName)) {
            // Timer/Animation functions - store reference and call cleanup function
            const cleanupFunction = SIDE_EFFECT_CLEANUP_MAP[functionName] || 'clearTimeout'
            replacement = `onMounted(() => {
${indent}${baseIndent}const timer = ${nodeText}

${indent}${baseIndent}onUnmounted(() => {
${indent}${baseIndent}${baseIndent}${cleanupFunction}(timer)
${indent}${baseIndent}})
${indent}})`
          }
          else if (['IntersectionObserver', 'MutationObserver', 'ResizeObserver', 'PerformanceObserver'].includes(functionName)) {
            // Observer constructors - store reference and call disconnect
            replacement = `onMounted(() => {
${indent}${baseIndent}const observer = ${nodeText}

${indent}${baseIndent}onUnmounted(() => {
${indent}${baseIndent}${baseIndent}observer.disconnect()
${indent}${baseIndent}})
${indent}})`
          }
          else if (['WebSocket', 'EventSource'].includes(functionName)) {
            // Network connections - store reference and call close
            replacement = `onMounted(() => {
${indent}${baseIndent}const connection = ${nodeText}

${indent}${baseIndent}onUnmounted(() => {
${indent}${baseIndent}${baseIndent}connection.close()
${indent}${baseIndent}})
${indent}})`
          }
          else {
            // Fallback for unknown side effects
            replacement = `onMounted(() => {
${indent}${baseIndent}const resource = ${nodeText}

${indent}${baseIndent}onUnmounted(() => {
${indent}${baseIndent}${baseIndent}// TODO: Add appropriate cleanup for ${functionName}
${indent}${baseIndent}})
${indent}})`
          }

          return fixer.replaceText(statement, replacement)
        },
      })
    }

    return {
      CallExpression(node) {
        // Only check calls to side effect functions
        if (!isSideEffectCall(node)) {
          return
        }

        const inVueScriptSetup = isInVueScriptSetup(node)
        const inFunction = isInFunction(node)

        // Only report if we're in Vue script setup but NOT inside a function
        // (being inside a function like onMounted is fine)
        if (inVueScriptSetup && !inFunction) {
          const functionName = node.callee.type === 'Identifier' ? node.callee.name : 'unknown'
          reportSideEffect(node, functionName)
        }
      },
      NewExpression(node) {
        // Check constructor calls like new IntersectionObserver()
        if (node.callee.type !== 'Identifier' || !SIDE_EFFECT_FUNCTIONS.has(node.callee.name)) {
          return
        }

        const inVueScriptSetup = isInVueScriptSetup(node)
        const inFunction = isInFunction(node)

        // Only report if we're in Vue script setup but NOT inside a function
        // (being inside a function like onMounted is fine)
        if (inVueScriptSetup && !inFunction) {
          const functionName = node.callee.type === 'Identifier' ? node.callee.name : 'unknown'
          reportSideEffect(node, functionName)
        }
      },
    }
  },
})
