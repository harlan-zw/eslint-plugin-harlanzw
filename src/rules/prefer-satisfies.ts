import type { TSESTree } from '@typescript-eslint/utils'
import { createEslintRule } from '../utils'

export const RULE_NAME = 'prefer-satisfies'
export type MessageIds = 'preferSatisfies' | 'useSatisfies'
export type Options = []

const OPEN_KEYS = new Set([
  'TSStringKeyword',
  'TSNumberKeyword',
])

const OPAQUE_VALUES = new Set([
  'TSAnyKeyword',
  'TSUnknownKeyword',
])

function typeName(node: TSESTree.TypeNode): string | null {
  return node.type === 'TSTypeReference' && node.typeName.type === 'Identifier'
    ? node.typeName.name
    : null
}

/**
 * A widening annotation is one that erases the object's key set: `Record<string, V>`,
 * `Readonly<Record<string, V>>`, or a bare index signature. A finite key union
 * (`Record<Status, V>`) is not widening -- it buys exhaustiveness, so it is left alone.
 */
function isWideningAnnotation(node: TSESTree.TypeNode): boolean {
  // { [key: string]: V }
  if (node.type === 'TSTypeLiteral') {
    return node.members.length === 1
      && node.members[0].type === 'TSIndexSignature'
      && isOpenIndexSignature(node.members[0])
  }

  const name = typeName(node)
  if (!name)
    return false

  const args = node.type === 'TSTypeReference' ? node.typeArguments?.params : undefined
  if (!args)
    return false

  // Readonly<Record<string, V>> / Partial<Record<string, V>>
  if ((name === 'Readonly' || name === 'Partial') && args.length === 1)
    return isWideningAnnotation(args[0])

  if (name !== 'Record' || args.length !== 2)
    return false

  return OPEN_KEYS.has(args[0].type) && !OPAQUE_VALUES.has(args[1].type)
}

function isOpenIndexSignature(member: TSESTree.TSIndexSignature): boolean {
  const key = member.parameters[0]
  const keyType = key?.type === 'Identifier' ? key.typeAnnotation?.typeAnnotation : undefined
  const valueType = member.typeAnnotation?.typeAnnotation
  return !!keyType
    && !!valueType
    && OPEN_KEYS.has(keyType.type)
    && !OPAQUE_VALUES.has(valueType.type)
}

/** Keys are only evidence worth preserving when every one of them is statically present. */
function hasStaticKeys(node: TSESTree.ObjectExpression): boolean {
  return node.properties.length > 0
    && node.properties.every(p => p.type === 'Property')
}

/**
 * A lookup map read by a computed key needs the wide annotation to stay indexable.
 * Narrowing it to its literal keys makes every `map[someString]` an implicit `any`,
 * so `satisfies` would trade a lint warning for a type error.
 */
function isDynamicallyIndexed(references: TSESTree.Identifier[]): boolean {
  return references.some((id) => {
    const parent = id.parent
    if (parent?.type !== 'MemberExpression' || parent.object !== id || !parent.computed)
      return false

    // `x['a']` and `x[0]` name one key, so the key set can still be narrowed.
    return parent.property.type !== 'Literal'
  })
}

/**
 * Vue template expressions are parsed into a separate AST, so the script's scope
 * analysis never sees `<UIcon :name="icons[label]" />`. Collect the names read
 * with a computed key straight from the template body instead.
 */
function templateComputedReads(sourceCode: any): Set<string> {
  const names = new Set<string>()
  const body = sourceCode?.ast?.templateBody
  if (!body)
    return names

  const seen = new Set<object>()
  const stack: any[] = [body]
  while (stack.length) {
    const node = stack.pop()
    if (!node || typeof node !== 'object' || seen.has(node))
      continue
    seen.add(node)

    if (Array.isArray(node)) {
      stack.push(...node)
      continue
    }

    if (
      node.type === 'MemberExpression'
      && node.computed
      && node.object?.type === 'Identifier'
      && node.property?.type !== 'Literal'
    ) {
      names.add(node.object.name)
    }

    for (const key of Object.keys(node)) {
      // `parent` walks back up and would loop forever.
      if (key === 'parent')
        continue
      const value = node[key]
      if (value && typeof value === 'object')
        stack.push(value)
    }
  }
  return names
}

/**
 * `satisfies` freezes the key set, so an object that is written to after
 * declaration genuinely needs the wide annotation.
 */
function isMutated(references: TSESTree.Identifier[]): boolean {
  return references.some((id) => {
    const parent = id.parent

    // Object.assign(target, ...)
    if (parent?.type === 'CallExpression' && parent.arguments[0] === id) {
      const callee = parent.callee
      if (
        callee.type === 'MemberExpression'
        && callee.object.type === 'Identifier'
        && callee.object.name === 'Object'
        && callee.property.type === 'Identifier'
        && callee.property.name === 'assign'
      ) {
        return true
      }
    }

    if (parent?.type !== 'MemberExpression' || parent.object !== id)
      return false

    const grandparent = parent.parent
    // x.a = v / x[k] = v
    if (grandparent?.type === 'AssignmentExpression' && grandparent.left === parent)
      return true
    // x.a++ / x[k]--
    if (grandparent?.type === 'UpdateExpression')
      return true
    // delete x[k]
    return grandparent?.type === 'UnaryExpression' && grandparent.operator === 'delete'
  })
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'prefer `satisfies` over a widening type annotation on object literals',
    },
    hasSuggestions: true,
    schema: [],
    messages: {
      preferSatisfies: 'Annotating with `{{annotation}}` discards the object\'s known keys. Use `satisfies` to keep them.',
      useSatisfies: 'Replace the annotation with `satisfies {{annotation}}`.',
    },
  },
  defaultOptions: [],
  create: (context) => {
    const sourceCode = context.sourceCode ?? context.getSourceCode()
    // The template AST is fixed for the file, so walk it at most once.
    let templateReads: Set<string> | null = null

    return {
      VariableDeclarator(node) {
        const declaration = node.parent
        if (declaration.type !== 'VariableDeclaration' || declaration.kind !== 'const')
          return

        if (node.id.type !== 'Identifier')
          return

        const annotation = node.id.typeAnnotation?.typeAnnotation
        if (!annotation || !isWideningAnnotation(annotation))
          return

        if (node.init?.type !== 'ObjectExpression' || !hasStaticKeys(node.init))
          return

        const [variable] = sourceCode.getDeclaredVariables(node)
        if (!variable)
          return

        const references = variable.references
          .filter(ref => ref.identifier !== node.id)
          .map(ref => ref.identifier as TSESTree.Identifier)

        if (isMutated(references) || isDynamicallyIndexed(references))
          return

        templateReads ??= templateComputedReads(sourceCode)
        if (templateReads.has(node.id.name))
          return

        const annotationText = sourceCode.getText(annotation)
        const data = { annotation: annotationText }

        context.report({
          node: node.id.typeAnnotation!,
          messageId: 'preferSatisfies',
          data,
          suggest: [{
            messageId: 'useSatisfies',
            data,
            fix: fixer => [
              fixer.remove(node.id.typeAnnotation!),
              fixer.insertTextAfter(node.init!, ` satisfies ${annotationText}`),
            ],
          }],
        })
      },
    }
  },
})
