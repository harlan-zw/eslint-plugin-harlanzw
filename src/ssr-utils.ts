import type { TSESTree } from '@typescript-eslint/utils'

/**
 * Lifecycle hooks that only run on the client (never during SSR).
 */
const CLIENT_LIFECYCLE_HOOKS = new Set([
  'onMounted',
  'onBeforeMount',
  'onUpdated',
  'onBeforeUpdate',
  'onActivated',
  'onDeactivated',
])

/**
 * Vue watchers whose callbacks are deferred (not executed synchronously during setup).
 * Note: watchEffect/watchSyncEffect/watchPostEffect execute immediately and are NOT included.
 */
const DEFERRED_CALLBACK_FUNCTIONS = new Set([
  'watch',
])

/**
 * Nitro/H3 server handler functions — these never hydrate, so SSR rules don't apply.
 */
const SERVER_HANDLER_FUNCTIONS = new Set([
  'defineEventHandler',
  'defineCachedEventHandler',
  'defineNitroPlugin',
  'defineTask',
])

/**
 * Check if a function node is a "named" function — one that's declared or assigned to a variable.
 * Named functions (event handlers, utility functions) are just defined during setup, not executed.
 * Inline callbacks (e.g. `.sort(() => ...)`) are anonymous and execute synchronously during setup.
 */
function isNamedFunction(funcNode: TSESTree.Node): boolean {
  if (funcNode.type === 'FunctionDeclaration')
    return true

  const parent = funcNode.parent
  if (!parent)
    return false

  // const foo = () => {} or const foo = function() {}
  if (parent.type === 'VariableDeclarator')
    return true

  // { foo: () => {} } or { foo() {} }
  // Exception: setup() inside defineComponent() executes during setup
  if (parent.type === 'Property') {
    if (
      parent.key.type === 'Identifier'
      && parent.key.name === 'setup'
      && parent.parent?.type === 'ObjectExpression'
      && parent.parent.parent?.type === 'CallExpression'
      && parent.parent.parent.callee.type === 'Identifier'
      && parent.parent.parent.callee.name === 'defineComponent'
    ) {
      return false
    }
    return true
  }

  // class Foo { bar() {} }
  if (parent.type === 'MethodDefinition')
    return true

  // foo = () => {}
  if (parent.type === 'AssignmentExpression' && parent.left.type === 'Identifier')
    return true

  return false
}

/**
 * Checks if a node executes during component setup (not deferred to a lifecycle hook, event handler, or watcher).
 *
 * Walks up through enclosing functions:
 * - Client lifecycle hook callback → safe (client-only)
 * - Deferred watcher callback (watch) → safe (not called during initial setup)
 * - Named function (declaration, variable, property, method) → safe (just defined, not called)
 * - Inline callback (.sort(() => ...), .map(() => ...)) → transparent, keep walking
 * - Reaches Program → in setup scope
 */
export function executedDuringSetup(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent
  while (current) {
    if (
      current.type === 'ArrowFunctionExpression'
      || current.type === 'FunctionExpression'
      || current.type === 'FunctionDeclaration'
    ) {
      // Check if this function is a callback to a client lifecycle hook or deferred watcher
      if (
        (current.type === 'ArrowFunctionExpression' || current.type === 'FunctionExpression')
        && current.parent?.type === 'CallExpression'
        && current.parent.callee.type === 'Identifier'
      ) {
        const calleeName = current.parent.callee.name
        if (CLIENT_LIFECYCLE_HOOKS.has(calleeName))
          return false

        if (SERVER_HANDLER_FUNCTIONS.has(calleeName))
          return false

        // For watch(), only the callback (2nd+ arg) is deferred; the getter (1st arg) executes during setup
        if (DEFERRED_CALLBACK_FUNCTIONS.has(calleeName)) {
          const args = current.parent.arguments
          const argIndex = args.indexOf(current as TSESTree.CallExpression['arguments'][number])
          if (argIndex > 0)
            return false
        }
      }

      // Named function → just defined, not executed during setup
      if (isNamedFunction(current))
        return false

      // Otherwise it's an inline callback — keep walking up
    }

    if (current.type === 'Program')
      return true

    current = current.parent
  }
  return false
}

/**
 * Check if a node is a client guard test expression.
 * Matches: import.meta.client, process.client, typeof window !== 'undefined'
 */
function isClientGuardTest(test: TSESTree.Expression): boolean {
  // import.meta.client
  if (
    test.type === 'MemberExpression'
    && test.object.type === 'MetaProperty'
    && test.property.type === 'Identifier'
    && test.property.name === 'client'
  ) {
    return true
  }

  // process.client
  if (
    test.type === 'MemberExpression'
    && test.object.type === 'Identifier'
    && test.object.name === 'process'
    && test.property.type === 'Identifier'
    && test.property.name === 'client'
  ) {
    return true
  }

  // typeof window !== 'undefined'
  if (
    test.type === 'BinaryExpression'
    && test.left.type === 'UnaryExpression'
    && test.left.operator === 'typeof'
    && test.left.argument.type === 'Identifier'
    && test.left.argument.name === 'window'
  ) {
    return true
  }

  return false
}

/**
 * Check if a node is inside a client guard — either an if statement or a ternary expression.
 * Only the truthy/consequent branch is considered safe.
 */
export function isInsideClientGuard(node: TSESTree.Node): boolean {
  let parent: TSESTree.Node | undefined = node.parent
  while (parent) {
    // if (import.meta.client) { ... } — check we're in the consequent, not the else
    if (parent.type === 'IfStatement' && isClientGuardTest(parent.test))
      return isDescendantOfConsequent(node, parent)

    // import.meta.client ? Math.random() : 0 — only the consequent is safe
    if (
      parent.type === 'ConditionalExpression'
      && isClientGuardTest(parent.test)
    ) {
      return isInConsequentBranch(node, parent)
    }

    parent = parent.parent
  }
  return false
}

/**
 * Check if `node` is a descendant of the consequent (truthy) branch of an IfStatement.
 */
function isDescendantOfConsequent(node: TSESTree.Node, ifStmt: TSESTree.IfStatement): boolean {
  let current: TSESTree.Node | undefined = node
  while (current && current !== ifStmt) {
    if (current === ifStmt.consequent)
      return true
    current = current.parent
  }
  return false
}

/**
 * Check if `node` is within the consequent (truthy) branch of a ConditionalExpression.
 */
function isInConsequentBranch(node: TSESTree.Node, ternary: TSESTree.ConditionalExpression): boolean {
  let current: TSESTree.Node | undefined = node
  while (current && current !== ternary) {
    if (current === ternary.consequent)
      return true
    if (current === ternary.alternate)
      return false
    current = current.parent
  }
  return false
}
