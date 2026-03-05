import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
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

// VueUse reactive APIs that don't follow the use* pattern
export const VUEUSE_REACTIVITY_APIS = new Set([
  // Watch variants
  'whenever',
  'watchArray',
  'watchAtMost',
  'watchDebounced',
  'watchDeep',
  'watchIgnorable',
  'watchImmediate',
  'watchOnce',
  'watchPausable',
  'watchThrottled',
  'watchTriggerable',
  'watchWithFilter',
  'debouncedWatch',
  'throttledWatch',
  'until',
  // Computed variants
  'computedAsync',
  'computedEager',
  'computedInject',
  'computedWithControl',
  // Reactive utilities
  'reactiveComputed',
  'reactiveOmit',
  'reactivePick',
  'toReactive',
  // Ref utilities
  'controlledRef',
  'debouncedRef',
  'throttledRef',
  'refAutoReset',
  'refDebounced',
  'refDefault',
  'refThrottled',
  'refWithControl',
  'extendRef',
  'syncRef',
  'syncRefs',
  'templateRef',
  // State management
  'createGlobalState',
  'createInjectionState',
  'createSharedComposable',
  // Event/lifecycle hooks
  'onClickOutside',
  'onKeyStroke',
  'onLongPress',
  'onStartTyping',
  'createEventHook',
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
  scriptVisitor?: TSESLint.RuleListener,
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

const COMPOSABLE_RE = /^use[A-Z_]/

export function isComposableCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type === 'Identifier') {
    return COMPOSABLE_RE.test(node.callee.name)
  }
  return false
}

export function isComposableName(name: string): boolean {
  return COMPOSABLE_RE.test(name)
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

export function trackNonVueImports(node: TSESTree.ImportDeclaration, nonVueImports: Set<string>): void {
  if (node.source.value !== 'vue') {
    for (const spec of node.specifiers) {
      if (spec.type === 'ImportSpecifier' && spec.imported.type === 'Identifier') {
        nonVueImports.add(spec.imported.name)
      }
    }
  }
}

export function createReactivityChecker(vueImports: Set<string>, nonVueImports: Set<string>) {
  function isAutoImportedReactivityCall(node: TSESTree.CallExpression): boolean {
    if (node.callee.type === 'Identifier') {
      const name = node.callee.name
      return (VUE_REACTIVITY_APIS.has(name) || VUEUSE_REACTIVITY_APIS.has(name)) && !nonVueImports.has(name)
    }
    return false
  }

  function isReactiveLifecycleCall(node: TSESTree.CallExpression): boolean {
    return node.callee.type === 'Identifier' && /^tryOn[A-Z]/.test(node.callee.name)
  }

  function hasReactivityInExpression(expr: TSESTree.Expression | null): boolean {
    if (!expr)
      return false

    switch (expr.type) {
      case 'CallExpression':
        if (isReactivityCall(expr, vueImports) || isAutoImportedReactivityCall(expr) || isComposableCall(expr) || isReactiveLifecycleCall(expr))
          return true
        return expr.arguments.some(arg => hasReactivityInArg(arg))
      case 'NewExpression':
        return expr.arguments.some(arg => hasReactivityInArg(arg))
      case 'MemberExpression':
        return hasReactivityInExpression(expr.object as TSESTree.Expression)
      case 'AssignmentExpression':
        return hasReactivityInExpression(expr.right)
      case 'ObjectExpression':
        return expr.properties.some(prop =>
          prop.type === 'Property' && hasReactivityInExpression(prop.value as TSESTree.Expression))
      case 'ArrayExpression':
        return expr.elements.some(elem =>
          hasReactivityInExpression(elem as TSESTree.Expression))
      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        if (expr.body.type === 'BlockStatement')
          return expr.body.body.some(stmt => hasReactivityInStatement(stmt))
        return hasReactivityInExpression(expr.body)
      case 'AwaitExpression':
        return hasReactivityInExpression(expr.argument)
      case 'ConditionalExpression':
        return hasReactivityInExpression(expr.consequent) || hasReactivityInExpression(expr.alternate)
      case 'LogicalExpression':
        return hasReactivityInExpression(expr.left) || hasReactivityInExpression(expr.right)
      default:
        return false
    }
  }

  function hasReactivityInArg(arg: TSESTree.CallExpression['arguments'][number]): boolean {
    if (arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression') {
      if (arg.body.type === 'BlockStatement')
        return arg.body.body.some(stmt => hasReactivityInStatement(stmt))
      return hasReactivityInExpression(arg.body)
    }
    if (arg.type === 'SpreadElement')
      return hasReactivityInExpression(arg.argument)
    return hasReactivityInExpression(arg)
  }

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

  return { hasReactivityInStatement, hasReactivityInExpression }
}

// Re-export commonly used AST utilities for convenience
export { isAwaited, isFunctionCall, isInFunction, isReturned } from './ast-utils'
