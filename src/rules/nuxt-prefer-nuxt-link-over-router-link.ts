import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'nuxt-prefer-nuxt-link-over-router-link'
export type MessageIds = 'preferNuxtLink'
export type Options = []

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer NuxtLink over RouterLink in Nuxt applications',
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferNuxtLink: 'Use <NuxtLink> instead of <RouterLink> in Nuxt applications for better performance and features.',
    },
  },
  defaultOptions: [],
  create(context) {
    // For Vue SFC files
    if (isVueParser(context as any)) {
      const scriptVisitor = {
        // Empty script visitor - we don't need to track anything in the script
      }

      const templateVisitor = {
        VElement(node: any) {
          // Vue parser converts element names to lowercase, preserving hyphens
          if (node.name === 'routerlink' || node.name === 'router-link') {
            context.report({
              node,
              messageId: 'preferNuxtLink',
              fix(fixer) {
                const startTag = node.startTag
                const endTag = node.endTag
                const fixes = []

                // Fix opening tag
                if (startTag) {
                  const openTagText = context.getSourceCode().getText(startTag)
                  const fixedOpenTag = openTagText.replace(/router-link|RouterLink/gi, 'NuxtLink')
                  fixes.push(fixer.replaceText(startTag, fixedOpenTag))
                }

                // Fix closing tag if it exists
                if (endTag) {
                  const closeTagText = context.getSourceCode().getText(endTag)
                  const fixedCloseTag = closeTagText.replace(/router-link|RouterLink/gi, 'NuxtLink')
                  fixes.push(fixer.replaceText(endTag, fixedCloseTag))
                }

                return fixes
              },
            })
          }
        },
      }

      return defineTemplateBodyVisitor(context, templateVisitor, scriptVisitor)
    }

    // For non-Vue files (template literals, JSX, etc.)
    return {
      JSXElement(node: any) {
        if (node.openingElement?.name?.name === 'RouterLink') {
          context.report({
            node,
            messageId: 'preferNuxtLink',
            fix(fixer) {
              const fixes = []

              // Fix opening element
              const openingElement = node.openingElement
              if (openingElement?.name?.name === 'RouterLink') {
                fixes.push(fixer.replaceText(openingElement.name, 'NuxtLink'))
              }

              // Fix closing element if it exists
              const closingElement = node.closingElement
              if (closingElement?.name?.name === 'RouterLink') {
                fixes.push(fixer.replaceText(closingElement.name, 'NuxtLink'))
              }

              return fixes
            },
          })
        }
      },
    }
  },
})
