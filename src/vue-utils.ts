import type { TSESTree } from '@typescript-eslint/utils'
import type { Rule } from 'eslint'
import { isAtTopLevel } from './ast-utils'

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

/**
 * Side effect functions that should be moved to onMounted in Vue script setup.
 * These functions create persistent effects that need cleanup during SSR.
 */
export const SIDE_EFFECT_FUNCTIONS = new Set([
  // Timer functions
  'setTimeout',
  'setInterval',
  // Animation functions
  'requestAnimationFrame',
  'requestIdleCallback',
  // Observer constructors (when called with 'new')
  'IntersectionObserver',
  'MutationObserver',
  'ResizeObserver',
  'PerformanceObserver',
  // Network/Streaming
  'WebSocket',
  'EventSource',
])

/**
 * Maps side effect functions to their corresponding cleanup functions.
 * Note: Some cleanup patterns are more complex and handled in the auto-fix logic.
 */
export const SIDE_EFFECT_CLEANUP_MAP: Record<string, string> = {
  // Timer functions
  setTimeout: 'clearTimeout',
  setInterval: 'clearInterval',
  // Animation functions
  requestAnimationFrame: 'cancelAnimationFrame',
  requestIdleCallback: 'cancelIdleCallback',
  // Observers (use disconnect method)
  IntersectionObserver: 'disconnect',
  MutationObserver: 'disconnect',
  ResizeObserver: 'disconnect',
  PerformanceObserver: 'disconnect',
  // Network (use close method)
  WebSocket: 'close',
  EventSource: 'close',
}

export function isRefCall(node: TSESTree.CallExpression): boolean {
  return node.callee.type === 'Identifier' && node.callee.name === 'ref'
}

export function isSideEffectCall(node: TSESTree.CallExpression): boolean {
  return node.callee.type === 'Identifier' && SIDE_EFFECT_FUNCTIONS.has(node.callee.name)
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

export function isInVueScriptSetup(node: TSESTree.Node): boolean {
  return isAtTopLevel(node)
}

export function isDefinePropsCall(node: TSESTree.CallExpression): boolean {
  return node.callee.type === 'Identifier' && node.callee.name === 'defineProps'
}

export function isToRefsCall(node: TSESTree.CallExpression): boolean {
  return node.callee.type === 'Identifier' && node.callee.name === 'toRefs'
}

export function isRefAccess(node: TSESTree.MemberExpression): boolean {
  return node.property.type === 'Identifier' && node.property.name === 'value'
}

export function trackVueImports(node: TSESTree.ImportDeclaration, vueImports: Set<string>): void {
  if (node.source.value === 'vue') {
    node.specifiers.forEach((spec) => {
      if (spec.type === 'ImportSpecifier') {
        const imported = spec.imported
        if (imported.type === 'Identifier') {
          vueImports.add(imported.name)
        }
      }
    })
  }
}

// Re-export commonly used AST utilities for convenience
export { isAwaited, isFunctionCall, isInFunction, isReturned } from './ast-utils'
