import type { TSESTree } from '@typescript-eslint/utils'
import { executedDuringSetup, isInsideClientGuard } from '../ssr-utils'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'nuxt-no-unsafe-date'
export type MessageIds = 'noDateNow' | 'noNewDate' | 'noDateCall' | 'noDateNowTemplate' | 'noNewDateTemplate' | 'noDateCallTemplate'
export type Options = []

function isDateNowCall(node: TSESTree.CallExpression): boolean {
  return (
    node.callee.type === 'MemberExpression'
    && node.callee.object.type === 'Identifier'
    && node.callee.object.name === 'Date'
    && node.callee.property.type === 'Identifier'
    && node.callee.property.name === 'now'
  )
}

/**
 * Date() called as a function (without new) returns current time as a string.
 */
function isDateFunctionCall(node: TSESTree.CallExpression): boolean {
  return (
    node.callee.type === 'Identifier'
    && node.callee.name === 'Date'
    && node.parent?.type !== 'NewExpression'
  )
}

function isNewDateCall(node: TSESTree.NewExpression): boolean {
  return (
    node.callee.type === 'Identifier'
    && node.callee.name === 'Date'
    && node.arguments.length === 0
  )
}

/**
 * Check if `new Date()` is immediately chained with a stable method like `.getFullYear()`.
 * These return the same value on server and client (unless at exact midnight on New Year's).
 */
const STABLE_DATE_METHODS = new Set([
  'getFullYear',
  'getUTCFullYear',
  'getMonth',
  'getUTCMonth',
  'getDate',
  'getUTCDate',
  'getDay',
  'getUTCDay',
])

function isChainedWithStableMethod(node: TSESTree.NewExpression): boolean {
  const parent = node.parent as TSESTree.Node | undefined
  if (parent?.type !== 'MemberExpression' || parent.object !== node)
    return false
  const prop = parent.property
  if (prop.type !== 'Identifier' || !STABLE_DATE_METHODS.has(prop.name))
    return false
  // Ensure the member expression is actually called: new Date().getFullYear()
  const grandparent = parent.parent as TSESTree.Node | undefined
  return grandparent?.type === 'CallExpression' && grandparent.callee === parent
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow Date.now() and new Date() in SSR-rendered code to prevent hydration mismatches',
    },
    schema: [],
    messages: {
      noDateNow: 'Date.now() returns different timestamps on server and client, causing hydration mismatches. Use the <NuxtTime> component or move to onMounted().',
      noNewDate: 'new Date() returns different timestamps on server and client, causing hydration mismatches. Use the <NuxtTime> component or move to onMounted().',
      noDateCall: 'Date() returns the current time as a string, which differs on server and client. Use the <NuxtTime> component or move to onMounted().',
      noDateNowTemplate: 'Date.now() in templates returns different timestamps on server and client. Use the <NuxtTime> component instead.',
      noNewDateTemplate: 'new Date() in templates returns different timestamps on server and client. Use the <NuxtTime> component instead.',
      noDateCallTemplate: 'Date() in templates returns the current time, which differs on server and client. Use the <NuxtTime> component instead.',
    },
  },
  defaultOptions: [],
  create: (context) => {
    const filename = context.filename || context.getFilename()
    if (!filename.endsWith('.vue'))
      return {}

    function checkCallScript(node: TSESTree.CallExpression) {
      const isNow = isDateNowCall(node)
      const isCall = !isNow && isDateFunctionCall(node)

      if (!isNow && !isCall)
        return

      if (!executedDuringSetup(node))
        return

      if (isInsideClientGuard(node))
        return

      context.report({ node, messageId: isNow ? 'noDateNow' : 'noDateCall' })
    }

    function checkNewScript(node: TSESTree.NewExpression) {
      if (!isNewDateCall(node))
        return

      if (isChainedWithStableMethod(node))
        return

      if (!executedDuringSetup(node))
        return

      if (isInsideClientGuard(node))
        return

      context.report({ node, messageId: 'noNewDate' })
    }

    if (isVueParser(context as any)) {
      return defineTemplateBodyVisitor(context, {
        CallExpression(node: any) {
          if (isDateNowCall(node))
            context.report({ node, messageId: 'noDateNowTemplate' })
          else if (isDateFunctionCall(node))
            context.report({ node, messageId: 'noDateCallTemplate' })
        },
        NewExpression(node: any) {
          if (isNewDateCall(node) && !isChainedWithStableMethod(node))
            context.report({ node, messageId: 'noNewDateTemplate' })
        },
      }, {
        CallExpression: checkCallScript,
        NewExpression: checkNewScript,
      })
    }

    return {}
  },
})
