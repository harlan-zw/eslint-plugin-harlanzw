import type { TSESTree } from '@typescript-eslint/utils'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'vue-no-unresolvable-define-emits'
export type MessageIds = 'noUnresolvableDefineEmits'
export type Options = []

/**
 * Checks whether a type node contains types that Vue's compiler cannot resolve
 * at compile time (e.g. `typeof variable`, indexed access types like `X[number]`,
 * conditional types, mapped types, template literal types).
 */
function hasUnresolvableType(node: TSESTree.TypeNode): boolean {
  switch (node.type) {
    case 'TSTypeQuery': // typeof x
    case 'TSConditionalType': // X extends Y ? A : B
    case 'TSMappedType': // { [K in keyof T]: V }
    case 'TSTemplateLiteralType': // `prefix${X}`
      return true
    case 'TSIndexedAccessType': // X[number], X["key"]
      return true
    case 'TSUnionType':
    case 'TSIntersectionType':
      return node.types.some(t => hasUnresolvableType(t))
    case 'TSTypeReference':
      // Type references to external types/generics are unresolvable by Vue compiler
      // but we only flag clearly unresolvable ones; simple type refs like `string` are fine
      if (node.typeArguments) {
        return node.typeArguments.params.some(t => hasUnresolvableType(t))
      }
      return false
    case 'TSParenthesizedType':
      return hasUnresolvableType(node.typeAnnotation)
    default:
      return false
  }
}

function checkDefineEmitsTypeParam(node: TSESTree.CallExpression, context: any): void {
  const typeArgs = node.typeArguments ?? (node as any).typeParameters
  if (!typeArgs || typeArgs.params.length === 0)
    return

  const typeParam = typeArgs.params[0]

  // Call signature style: defineEmits<{ (event: typeof X[number]): void }>()
  if (typeParam.type === 'TSTypeLiteral') {
    for (const member of typeParam.members) {
      if (member.type === 'TSCallSignatureDeclaration' && member.params.length > 0) {
        const eventParam = member.params[0]
        const annotation = eventParam.typeAnnotation?.typeAnnotation
        if (annotation && hasUnresolvableType(annotation)) {
          context.report({
            node: annotation,
            messageId: 'noUnresolvableDefineEmits',
          })
        }
      }
    }
  }
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow unresolvable types in defineEmits type parameters',
    },
    schema: [],
    messages: {
      noUnresolvableDefineEmits: 'Vue compiler cannot resolve this type at compile time in defineEmits. Use literal string types or a type alias with literal members instead.',
    },
  },
  defaultOptions: [],
  create: (context) => {
    function checkCall(node: any): void {
      if (
        node.callee?.type === 'Identifier'
        && node.callee.name === 'defineEmits'
      ) {
        checkDefineEmitsTypeParam(node, context)
      }
    }

    const scriptVisitor = {
      CallExpression: checkCall,
    }

    if (isVueParser(context)) {
      return defineTemplateBodyVisitor(context, {}, scriptVisitor)
    }

    return scriptVisitor
  },
})
