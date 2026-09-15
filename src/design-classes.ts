import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

// Vue parser nodes cross into the shared ESTree visitors here.
export interface ClassAttribute {
  type: 'VAttribute'
  directive: boolean
  key: { name: string | { name: string }, argument?: { type: string, name?: string } }
  value: null | { value?: string, expression?: TSESTree.Expression | null }
  parent: { parent: TemplateElement }
}

interface TemplateElement {
  name: string
  parent?: TemplateElement
  variables?: { id: { name: string } }[]
}

type ResolveClass = (name: string) => TSESTree.Expression | undefined

/** Track top-level const bindings. Template locals take precedence. */
export function createClassBindings(sourceCode: TSESLint.SourceCode) {
  const declarations = new Map<string, TSESTree.Expression>()
  // Follow aliases when checking writes. A const object can still change through its properties.
  function stable(variable: TSESLint.Scope.Variable, seen = new Set<TSESLint.Scope.Variable>()): boolean {
    if (seen.has(variable))
      return true
    seen.add(variable)
    return variable.references.every((reference) => {
      if (reference.isWrite())
        return !!reference.init
      let root: TSESTree.Node = reference.identifier
      while (root.parent && ['TSAsExpression', 'TSSatisfiesExpression', 'TSNonNullExpression'].includes(root.parent.type))
        root = root.parent
      let node = root
      while (node.parent?.type === 'MemberExpression' && node.parent.object === node)
        node = node.parent
      const parent = node.parent
      if ((parent?.type === 'AssignmentExpression' && parent.left === node) || parent?.type === 'UpdateExpression')
        return false
      // Calls may mutate arguments or the receiver. Do not execute helpers to guess their behavior.
      if (parent?.type === 'CallExpression' || parent?.type === 'NewExpression')
        return false
      if (parent?.type === 'VariableDeclarator' && parent.init === node && node === root) {
        const alias = sourceCode.getDeclaredVariables(parent).find(value => parent.id.type === 'Identifier' && value.name === parent.id.name)
        return !!alias && stable(alias, seen)
      }
      // An object stored inside another object may escape through that container.
      return !(node === root && (parent?.type === 'Property' || parent?.type === 'ArrayExpression'))
    })
  }
  return {
    visitors: {
      VariableDeclaration(node: TSESTree.VariableDeclaration) {
        if (node.kind !== 'const' || node.parent.type !== 'Program')
          return
        for (const declaration of node.declarations) {
          if (declaration.id.type !== 'Identifier' || !declaration.init)
            continue
          const name = declaration.id.name
          const variable = sourceCode.getDeclaredVariables(node).find(value => value.name === name)
          let initializer = declaration.init
          while (initializer.type === 'TSAsExpression' || initializer.type === 'TSSatisfiesExpression' || initializer.type === 'TSNonNullExpression')
            initializer = initializer.expression
          const immutable = initializer.type === 'Literal' || initializer.type === 'TemplateLiteral'
          if (variable && (immutable ? variable.references.some(reference => reference.isWrite() && !reference.init) : !stable(variable)))
            continue
          declarations.set(declaration.id.name, declaration.init)
        }
      },
    },
    resolve(attribute: ClassAttribute): ResolveClass {
      const locals = new Set<string>()
      for (let element: TemplateElement | undefined = attribute.parent.parent; element; element = element.parent) {
        for (const variable of element.variables ?? [])
          locals.add(variable.id.name)
      }
      return name => locals.has(name) ? undefined : declarations.get(name)
    },
  }
}

export type ClassFinding
  = | { _tag: 'Static', node: TSESTree.Node, value: string, slot?: string }
    | { _tag: 'Partial', node: TSESTree.Node }

/** Only inspect class values, never conditions, event handlers, or unrelated props. */
export function attributeClasses(attribute: ClassAttribute, resolve: ResolveClass = () => undefined): ClassFinding[] {
  if (!attribute.value)
    return []
  if (!attribute.directive) {
    return attribute.key.name === 'class'
      ? [{ _tag: 'Static', node: attribute as unknown as TSESTree.Node, value: attribute.value.value ?? '' }]
      : []
  }
  if (typeof attribute.key.name === 'string' || attribute.key.name.name !== 'bind')
    return []
  if (attribute.key.argument?.type !== 'VIdentifier')
    return []
  const name = attribute.key.argument.name
  if (name !== 'class' && name !== 'ui')
    return []
  return expressionClasses(attribute.value.expression, name === 'ui' ? 'slots' : 'classes', resolve)
}

/** Object spreads replace slot values. Unknown keys invalidate earlier values. */
function effectiveSlots(node: TSESTree.Expression | null | undefined, resolve: ResolveClass, seen = new Set<string>()): {
  unknown: boolean
  values: Map<string, TSESTree.Expression | undefined>
} {
  if (node?.type === 'Identifier' && !seen.has(node.name))
    return effectiveSlots(resolve(node.name), resolve, new Set([...seen, node.name]))
  if (node?.type === 'TSAsExpression' || node?.type === 'TSSatisfiesExpression' || node?.type === 'TSNonNullExpression')
    return effectiveSlots(node.expression, resolve, seen)
  const values = new Map<string, TSESTree.Expression | undefined>()
  if (node?.type !== 'ObjectExpression')
    return { unknown: true, values }
  let unknown = false
  for (const property of node.properties) {
    if (property.type === 'SpreadElement') {
      const spread = effectiveSlots(property.argument, resolve, seen)
      if (spread.unknown) {
        values.clear()
        unknown = true
      }
      for (const [name, value] of spread.values) values.set(name, value)
      continue
    }
    const name = !property.computed && property.key.type === 'Identifier'
      ? property.key.name
      : property.key.type === 'Literal' && typeof property.key.value === 'string' ? property.key.value : undefined
    if (name === undefined) {
      values.clear()
      unknown = true
      continue
    }
    values.set(name, property.kind === 'init' ? property.value as TSESTree.Expression : undefined)
  }
  return { unknown, values }
}

function expressionClasses(
  node: TSESTree.Expression | null | undefined,
  mode: 'slots' | 'classes',
  resolve: ResolveClass,
  slot?: string,
  seen = new Set<string>(),
): ClassFinding[] {
  if (!node)
    return []
  if (node.type === 'Identifier') {
    if (seen.has(node.name))
      return []
    return expressionClasses(resolve(node.name), mode, resolve, slot, new Set([...seen, node.name]))
  }
  if (node.type === 'TSAsExpression' || node.type === 'TSSatisfiesExpression' || node.type === 'TSNonNullExpression')
    return expressionClasses(node.expression, mode, resolve, slot, seen)
  if (node.type === 'ConditionalExpression')
    return [...expressionClasses(node.consequent, mode, resolve, slot, seen), ...expressionClasses(node.alternate, mode, resolve, slot, seen)]
  if (node.type === 'LogicalExpression') {
    return node.operator === '&&'
      ? expressionClasses(node.right, mode, resolve, slot, seen)
      : [...expressionClasses(node.left, mode, resolve, slot, seen), ...expressionClasses(node.right, mode, resolve, slot, seen)]
  }
  if (node.type === 'ArrayExpression')
    return node.elements.flatMap(value => value && value.type !== 'SpreadElement' ? expressionClasses(value, mode, resolve, slot, seen) : [])
  if (node.type === 'ObjectExpression') {
    if (mode === 'slots')
      return [...effectiveSlots(node, resolve).values].flatMap(([name, value]) => expressionClasses(value, 'classes', resolve, name, seen))
    return node.properties.flatMap((property) => {
      if (property.type !== 'Property')
        return []
      if (property.value.type === 'Literal' && !property.value.value)
        return []
      if (property.key.type === 'Literal' || property.computed)
        return expressionClasses(property.key as TSESTree.Expression, 'classes', resolve, slot, seen)
      return [{ _tag: 'Static', node: property.key, value: property.key.name, slot }]
    })
  }
  if (mode === 'slots')
    return []
  if (node.type === 'Literal' && typeof node.value === 'string')
    return [{ _tag: 'Static', node, value: node.value, slot }]
  if (node.type === 'TemplateLiteral') {
    const partial = node.expressions.some((_, index) =>
      /\S$/.test(node.quasis[index].value.raw) || /^\S/.test(node.quasis[index + 1].value.raw))
    if (partial) {
      const complete = node.quasis.map((quasi, index) => {
        let value = quasi.value.cooked ?? quasi.value.raw
        if (index > 0)
          value = value.replace(/^\S+/, '')
        if (index < node.quasis.length - 1)
          value = value.replace(/\S+$/, '')
        return { _tag: 'Static' as const, node: quasi, value, slot }
      })
      const expressions = node.expressions.flatMap((expression, index) =>
        !/\S$/.test(node.quasis[index].value.raw) && !/^\S/.test(node.quasis[index + 1].value.raw)
          ? expressionClasses(expression as TSESTree.Expression, mode, resolve, slot, seen)
          : [])
      return [...complete, ...expressions, { _tag: 'Partial', node }]
    }
    return [
      ...node.quasis.map(quasi => ({ _tag: 'Static' as const, node: quasi, value: quasi.value.cooked ?? quasi.value.raw, slot })),
      ...node.expressions.flatMap(value => expressionClasses(value as TSESTree.Expression, mode, resolve, slot, seen)),
    ]
  }
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    // Tailwind reads source text. Even 'p-' + '4' must not be folded into a class.
    const left = expressionClasses(node.left as TSESTree.Expression, mode, resolve, slot, seen)
    const right = expressionClasses(node.right, mode, resolve, slot, seen)
    const leftEnd = left[left.length - 1]
    const rightStart = right[0]
    const leftBoundary = leftEnd?._tag === 'Static' ? /\s$/.test(leftEnd.value) : false
    const rightBoundary = rightStart?._tag === 'Static' ? /^\s/.test(rightStart.value) : false
    if (!leftBoundary && !rightBoundary && (
      (leftEnd?._tag === 'Static' && /\S$/.test(leftEnd.value))
      || (rightStart?._tag === 'Static' && /^\S/.test(rightStart.value))
    )) {
      return [
        ...left.flatMap((finding, index) => finding._tag === 'Static'
          ? [{ ...finding, value: index === left.length - 1 ? finding.value.replace(/\S+$/, '') : finding.value }]
          : []),
        ...right.flatMap((finding, index) => finding._tag === 'Static'
          ? [{ ...finding, value: index === 0 ? finding.value.replace(/^\S+/, '') : finding.value }]
          : []),
        { _tag: 'Partial', node },
      ]
    }
    return [...left, ...right]
  }
  return []
}

/** Split variants without splitting colons inside arbitrary selectors or values. */
export function baseUtility(token: string): string {
  let depth = 0
  let start = 0
  let quote = ''
  for (let index = 0; index < token.length; index++) {
    const char = token[index]
    if (char === '\\') {
      index++
      continue
    }
    if (quote) {
      if (char === quote)
        quote = ''
      continue
    }
    if (char === '"' || char === '\'')
      quote = char
    else if (char === '[' || char === '(')
      depth++
    else if (char === ']' || char === ')')
      depth--
    else if (char === ':' && depth === 0)
      start = index + 1
  }
  return token.slice(start).replace(/^!|!$/g, '').replace(/^-/, '')
}

export function matchesUtility(utility: string, pattern: string): boolean {
  const expression = pattern.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*')
  return new RegExp(`^${expression}$`).test(utility)
}
