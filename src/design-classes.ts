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
          if (variable?.references.some(reference => reference.isWrite() && !reference.init))
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
    return node.properties.flatMap((property) => {
      if (property.type !== 'Property')
        return []
      if (mode === 'slots') {
        const name = !property.computed && property.key.type === 'Identifier'
          ? property.key.name
          : property.key.type === 'Literal' && typeof property.key.value === 'string' ? property.key.value : undefined
        return name && property.value.type !== 'AssignmentPattern'
          ? expressionClasses(property.value as TSESTree.Expression, 'classes', resolve, name, seen)
          : []
      }
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
    if (partial)
      return [{ _tag: 'Partial', node }]
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
      return [{ _tag: 'Partial', node }]
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
