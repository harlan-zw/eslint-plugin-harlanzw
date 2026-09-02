import type { TSESTree } from '@typescript-eslint/utils'
import { createEslintRule } from '../utils'

export const RULE_NAME = 'no-test-file-reads'
export type MessageIds = 'noTestFileRead'
export type Options = []

type ReadName = 'readFile' | 'readFileSync'

interface ScopeVariable {
  name: string
}

interface Scope {
  set: Map<string, ScopeVariable>
  upper: Scope | null
}

const FS_MODULES = new Set([
  'fs',
  'fs/promises',
  'node:fs',
  'node:fs/promises',
])

const READ_NAMES = new Set<ReadName>([
  'readFile',
  'readFileSync',
])

const SOURCE_FILE_RE = /\.(?:[cm]?[jt]s|jsx|tsx|vue)$/i

function readName(value: string | null): ReadName | null {
  return value && READ_NAMES.has(value as ReadName) ? value as ReadName : null
}

function staticPropertyName(node: TSESTree.MemberExpression): string | null {
  if (!node.computed && node.property.type === 'Identifier')
    return node.property.name
  if (node.computed && node.property.type === 'Literal' && typeof node.property.value === 'string')
    return node.property.value
  return null
}

function literalModuleName(node: TSESTree.Node | null | undefined): string | null {
  return node?.type === 'Literal' && typeof node.value === 'string' ? node.value : null
}

function isRequireCall(node: TSESTree.Node): node is TSESTree.CallExpression {
  return node.type === 'CallExpression'
    && node.callee.type === 'Identifier'
    && node.callee.name === 'require'
    && FS_MODULES.has(literalModuleName(node.arguments[0] as TSESTree.Node) ?? '')
}

function isFsModuleExpression(node: TSESTree.Node): boolean {
  if (node.type === 'AwaitExpression')
    return isFsModuleExpression(node.argument)
  if (node.type === 'ImportExpression')
    return FS_MODULES.has(literalModuleName(node.source) ?? '')
  return isRequireCall(node)
}

function dynamicImportCallbackParameter(node: TSESTree.Identifier): boolean {
  let current: TSESTree.Node | undefined = node.parent
  while (current) {
    if (
      current.type === 'ArrowFunctionExpression'
      || current.type === 'FunctionExpression'
      || current.type === 'FunctionDeclaration'
    ) {
      const parameter = current.params[0]
      if (parameter?.type !== 'Identifier' || parameter.name !== node.name)
        return false
      const call = current.parent
      if (call?.type !== 'CallExpression' || call.arguments[0] !== current)
        return false
      const callee = call.callee
      return callee.type === 'MemberExpression'
        && staticPropertyName(callee) === 'then'
        && isFsModuleExpression(callee.object)
    }
    current = current.parent
  }
  return false
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'warn when tests read source files or files with unknown paths',
    },
    schema: [],
    messages: {
      noTestFileRead: 'Test exported behaviour. Do not inspect source or unknown files with `{{name}}()`.',
    },
  },
  defaultOptions: [],
  create: (context) => {
    const sourceCode = context.sourceCode ?? context.getSourceCode()
    const directReaders = new Map<ScopeVariable, ReadName>()
    const fsNamespaces = new Set<ScopeVariable>()
    const knownPathEnds = new Map<ScopeVariable, string>()

    function declaredVariable(node: TSESTree.Node, name: string): ScopeVariable | null {
      const variables = sourceCode.getDeclaredVariables(node as any) as unknown as ScopeVariable[]
      return variables.find(variable => variable.name === name) ?? null
    }

    function resolvedVariable(node: TSESTree.Identifier): ScopeVariable | null {
      let scope = sourceCode.getScope(node as any) as unknown as Scope | null
      while (scope) {
        const variable = scope.set.get(node.name)
        if (variable)
          return variable
        scope = scope.upper
      }
      return null
    }

    function trackDirectReader(node: TSESTree.Node, localName: string, importedName: string): void {
      const name = readName(importedName)
      const variable = declaredVariable(node, localName)
      if (name && variable)
        directReaders.set(variable, name)
    }

    function trackNamespace(node: TSESTree.Node, localName: string): void {
      const variable = declaredVariable(node, localName)
      if (variable)
        fsNamespaces.add(variable)
    }

    function knownPathEnd(node: TSESTree.Node): string | null {
      if (node.type === 'Literal')
        return typeof node.value === 'string' ? node.value : null
      if (node.type === 'TemplateLiteral') {
        const end = node.quasis.at(-1)?.value.cooked
        return end || null
      }
      if (node.type === 'Identifier') {
        const variable = resolvedVariable(node)
        return variable ? knownPathEnds.get(variable) ?? null : null
      }
      if (node.type === 'CallExpression') {
        const lastArgument = node.arguments.at(-1)
        return lastArgument && lastArgument.type !== 'SpreadElement'
          ? knownPathEnd(lastArgument)
          : null
      }
      if (
        node.type === 'ChainExpression'
        || node.type === 'TSAsExpression'
        || node.type === 'TSNonNullExpression'
        || node.type === 'TSTypeAssertion'
      ) {
        return knownPathEnd(node.expression)
      }
      return null
    }

    function readsKnownNonSourceFile(node: TSESTree.CallExpression): boolean {
      const path = node.arguments[0]
      if (!path || path.type === 'SpreadElement')
        return false
      const end = knownPathEnd(path)
      return end !== null && !SOURCE_FILE_RE.test(end)
    }

    function trackPattern(node: TSESTree.VariableDeclarator, pattern: TSESTree.BindingName): void {
      if (pattern.type === 'Identifier') {
        trackNamespace(node, pattern.name)
        return
      }
      if (pattern.type !== 'ObjectPattern')
        return

      for (const property of pattern.properties) {
        if (property.type !== 'Property')
          continue
        const importedName = !property.computed && property.key.type === 'Identifier'
          ? property.key.name
          : property.key.type === 'Literal' && typeof property.key.value === 'string'
            ? property.key.value
            : null
        const localName = property.value.type === 'Identifier' ? property.value.name : null
        if (importedName === 'promises' && localName)
          trackNamespace(node, localName)
        else if (importedName && localName)
          trackDirectReader(node, localName, importedName)
      }
    }

    function isTrackedNamespace(node: TSESTree.Node): boolean {
      if (isFsModuleExpression(node))
        return true
      if (
        node.type === 'MemberExpression'
        && staticPropertyName(node) === 'promises'
      ) {
        return isTrackedNamespace(node.object)
      }
      if (node.type !== 'Identifier')
        return false
      if (dynamicImportCallbackParameter(node))
        return true
      const variable = resolvedVariable(node)
      return variable !== null && fsNamespaces.has(variable)
    }

    function memberReadName(node: TSESTree.MemberExpression): ReadName | null {
      const name = readName(staticPropertyName(node))
      if (!name)
        return null
      return isTrackedNamespace(node.object) ? name : null
    }

    function trackImport(node: TSESTree.ImportDeclaration): void {
      if (!FS_MODULES.has(String(node.source.value)))
        return
      for (const specifier of node.specifiers) {
        if (specifier.type === 'ImportSpecifier') {
          const importedName = specifier.imported.type === 'Identifier'
            ? specifier.imported.name
            : String(specifier.imported.value)
          if (importedName === 'promises')
            trackNamespace(node, specifier.local.name)
          else
            trackDirectReader(node, specifier.local.name, importedName)
        }
        else {
          trackNamespace(node, specifier.local.name)
        }
      }
    }

    return {
      Program(node) {
        for (const statement of node.body) {
          if (statement.type === 'ImportDeclaration')
            trackImport(statement)
        }
      },
      VariableDeclarator(node) {
        if (!node.init)
          return
        if (node.parent.kind === 'const' && node.id.type === 'Identifier') {
          const end = knownPathEnd(node.init)
          const variable = declaredVariable(node, node.id.name)
          if (end && variable)
            knownPathEnds.set(variable, end)
        }
        if (isTrackedNamespace(node.init)) {
          trackPattern(node, node.id)
          return
        }
        if (node.id.type !== 'Identifier' || node.init.type !== 'MemberExpression')
          return
        const name = memberReadName(node.init)
        if (name)
          trackDirectReader(node, node.id.name, name)
      },
      CallExpression(node) {
        let name: ReadName | null = null
        if (node.callee.type === 'Identifier') {
          const variable = resolvedVariable(node.callee)
          name = variable ? directReaders.get(variable) ?? null : null
        }
        else if (node.callee.type === 'MemberExpression') {
          name = memberReadName(node.callee)
        }
        if (!name)
          return
        if (readsKnownNonSourceFile(node))
          return
        context.report({
          node: node.callee,
          messageId: 'noTestFileRead',
          data: { name },
        })
      },
    }
  },
})
