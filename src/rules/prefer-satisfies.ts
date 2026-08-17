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

        if (isMutated(references))
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
