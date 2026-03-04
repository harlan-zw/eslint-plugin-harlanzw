import type { TSESTree } from '@typescript-eslint/utils'
import { executedDuringSetup, isInsideClientGuard } from '../ssr-utils'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'nuxt-no-random'
export type MessageIds = 'noMathRandom' | 'noCryptoRandom' | 'noMathRandomTemplate' | 'noCryptoRandomTemplate'
export type Options = []

function isMathRandomCall(node: TSESTree.CallExpression): boolean {
  return (
    node.callee.type === 'MemberExpression'
    && node.callee.object.type === 'Identifier'
    && node.callee.object.name === 'Math'
    && node.callee.property.type === 'Identifier'
    && node.callee.property.name === 'random'
  )
}

function isCryptoRandomCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type !== 'MemberExpression' || node.callee.property.type !== 'Identifier')
    return false

  const method = node.callee.property.name
  if (method !== 'randomUUID' && method !== 'getRandomValues')
    return false

  const obj = node.callee.object
  if (obj.type === 'Identifier' && obj.name === 'crypto')
    return true

  if (
    obj.type === 'MemberExpression'
    && obj.object.type === 'Identifier'
    && (obj.object.name === 'globalThis' || obj.object.name === 'window')
    && obj.property.type === 'Identifier'
    && obj.property.name === 'crypto'
  ) {
    return true
  }

  return false
}

function reportRandom(context: any, node: TSESTree.CallExpression, template: boolean) {
  if (isMathRandomCall(node)) {
    context.report({ node, messageId: template ? 'noMathRandomTemplate' : 'noMathRandom' })
  }
  else if (isCryptoRandomCall(node)) {
    const method = (node.callee as TSESTree.MemberExpression).property
    context.report({
      node,
      messageId: template ? 'noCryptoRandomTemplate' : 'noCryptoRandom',
      data: { method: `crypto.${(method as TSESTree.Identifier).name}` },
    })
  }
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow Math.random() and crypto random APIs in SSR-rendered code to prevent hydration mismatches',
    },
    schema: [],
    messages: {
      noMathRandom: 'Math.random() produces different values on server and client, causing hydration mismatches. Move to onMounted() or guard with `if (import.meta.client)`.',
      noCryptoRandom: '{{method}}() produces different values on server and client, causing hydration mismatches. Move to onMounted() or guard with `if (import.meta.client)`.',
      noMathRandomTemplate: 'Math.random() in templates produces different values on server and client, causing hydration mismatches. Move to a computed property backed by onMounted().',
      noCryptoRandomTemplate: '{{method}}() in templates produces different values on server and client, causing hydration mismatches. Move to a computed property backed by onMounted().',
    },
  },
  defaultOptions: [],
  create: (context) => {
    function checkScript(node: TSESTree.CallExpression) {
      if (!isMathRandomCall(node) && !isCryptoRandomCall(node))
        return

      if (!executedDuringSetup(node))
        return

      if (isInsideClientGuard(node))
        return

      reportRandom(context, node, false)
    }

    if (isVueParser(context as any)) {
      return defineTemplateBodyVisitor(context, {
        // Template expressions — always execute during render
        CallExpression(node: any) {
          if (isMathRandomCall(node) || isCryptoRandomCall(node))
            reportRandom(context, node, true)
        },
      }, {
        CallExpression: checkScript,
      })
    }

    return { CallExpression: checkScript }
  },
})
