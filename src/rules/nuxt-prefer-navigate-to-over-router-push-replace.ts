import { isCallExpression, isIdentifier, isMemberExpression } from '../ast-utils'
import { createEslintRule } from '../utils'

export const RULE_NAME = 'nuxt-prefer-navigate-to-over-router-push-replace'
export type MessageIds = 'preferNavigateTo'
export type Options = []

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'prefer navigateTo() over router.push() and router.replace() in Nuxt applications',
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferNavigateTo: 'Prefer navigateTo() over router.{{method}}() in Nuxt applications',
    },
  },
  defaultOptions: [],
  create: (context) => {
    // Track variables that are assigned from useRouter() calls
    const routerVariables = new Set<string>()

    return {
      VariableDeclarator(node) {
        // Track: const router = useRouter()
        if (node.init
          && isCallExpression(node.init)
          && isIdentifier(node.init.callee)
          && node.init.callee.name === 'useRouter'
          && node.id.type === 'Identifier') {
          routerVariables.add(node.id.name)
        }
      },

      AssignmentExpression(node) {
        // Track: router = useRouter()
        if (node.right
          && isCallExpression(node.right)
          && isIdentifier(node.right.callee)
          && node.right.callee.name === 'useRouter'
          && node.left.type === 'Identifier') {
          routerVariables.add(node.left.name)
        }
      },

      CallExpression(node) {
        // Check for router.push() or router.replace() calls
        if (isMemberExpression(node.callee)
          && isIdentifier(node.callee.object)
          && routerVariables.has(node.callee.object.name)
          && isIdentifier(node.callee.property)
          && (node.callee.property.name === 'push' || node.callee.property.name === 'replace')) {
          const method = node.callee.property.name
          const sourceCode = context.sourceCode || context.getSourceCode()

          context.report({
            node,
            messageId: 'preferNavigateTo',
            data: {
              method,
            },
            fix(fixer) {
              const args = node.arguments

              if (args.length === 0) {
                return fixer.replaceText(node, 'navigateTo()')
              }

              // Handle router.replace() - need to add { replace: true } option
              if (method === 'replace') {
                if (args.length === 1) {
                  // router.replace('/path') -> navigateTo('/path', { replace: true })
                  const firstArg = sourceCode.getText(args[0])
                  return fixer.replaceText(node, `navigateTo(${firstArg}, { replace: true })`)
                }
                else if (args.length === 2) {
                  // router.replace('/path', options) -> navigateTo('/path', { ...options, replace: true })
                  const firstArg = sourceCode.getText(args[0])
                  const secondArg = sourceCode.getText(args[1])
                  return fixer.replaceText(node, `navigateTo(${firstArg}, { ...${secondArg}, replace: true })`)
                }
              }
              else {
                // router.push() - just replace with navigateTo()
                const argsText = args.map(arg => sourceCode.getText(arg)).join(', ')
                return fixer.replaceText(node, `navigateTo(${argsText})`)
              }

              return null
            },
          })
        }
      },
    }
  },
})
