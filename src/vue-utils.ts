import type { TSESTree } from '@typescript-eslint/utils'
import type { Rule } from 'eslint'

export type VueTemplateListener = Record<string, (node: any) => void>

export const VUE_REACTIVITY_APIS = new Set([
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

export function isRefCall(node: TSESTree.CallExpression): boolean {
  return node.callee.type === 'Identifier' && node.callee.name === 'ref'
}

export function isInVueTemplateString(node: TSESTree.Node): boolean {
  let parent = node.parent
  while (parent) {
    if (parent.type === 'TemplateLiteral') {
      const grandparent = parent.parent
      if (grandparent?.type === 'TaggedTemplateExpression') {
        const tag = grandparent.tag
        if (tag.type === 'Identifier' && tag.name === 'html') {
          return true
        }
      }
    }
    parent = parent.parent
  }
  return false
}

export function getParserServices(context: any) {
  const legacy = context.sourceCode
  return legacy?.parserServices || context.parserServices
}

export function isVueParser(context: any): boolean {
  const parserServices = getParserServices(context)
  return !!parserServices?.defineTemplateBodyVisitor
}

export function defineTemplateBodyVisitor(
  context: any,
  templateVisitor: VueTemplateListener,
  scriptVisitor?: Rule.RuleListener,
) {
  const parserServices = getParserServices(context)
  if (!parserServices?.defineTemplateBodyVisitor) {
    return {}
  }
  return parserServices.defineTemplateBodyVisitor(
    templateVisitor,
    scriptVisitor,
  )
}

export function isReactivityCall(node: TSESTree.CallExpression, vueImports: Set<string>): boolean {
  if (node.callee.type === 'Identifier') {
    return VUE_REACTIVITY_APIS.has(node.callee.name) && vueImports.has(node.callee.name)
  }
  return false
}

export function isComposableCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type === 'Identifier') {
    return /^use[A-Z_]/.test(node.callee.name)
  }
  return false
}

export function isComposableName(name: string): boolean {
  return /^use[A-Z_]/.test(name)
}
