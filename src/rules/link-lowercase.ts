import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'link-lowercase'
export type MessageIds = 'uppercase'
export type Options = []

function getLinkUrl(node: any): { url: string | null, attrNode: any | null } {
  if (!node.startTag?.attributes) {
    return { url: null, attrNode: null }
  }

  // Check for href or to attributes
  for (const attr of node.startTag.attributes) {
    if (attr.key?.name === 'href' || attr.key?.name === 'to') {
      if (attr.value?.type === 'VLiteral') {
        return { url: attr.value.value, attrNode: attr }
      }
    }
  }

  return { url: null, attrNode: null }
}

function fixUppercaseInUrl(context: any, attrNode: any, url: string) {
  const lowercaseUrl = url.toLowerCase()
  const sourceCode = context.getSourceCode()
  const attrText = sourceCode.getText(attrNode)

  // Replace the URL value while preserving quotes
  const fixedAttrText = attrText.replace(url, lowercaseUrl)
  return fixedAttrText
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensures link URLs do not contain uppercase characters',
    },
    fixable: 'code',
    schema: [],
    messages: {
      uppercase: 'Link URL "{{url}}" should not contain uppercase characters.',
    },
  },
  defaultOptions: [],
  create(context) {
    function checkLinkUrl(node: any) {
      const { url, attrNode } = getLinkUrl(node)

      if (!url || !attrNode) {
        return
      }

      // Check for uppercase characters, but ignore URL-encoded sequences (%XX)
      const hasUppercase = /[A-Z]/.test(url)
      const isUrlEncoded = /%[0-9A-F]{2}/i.test(url)
      
      if (hasUppercase && !isUrlEncoded) {
        context.report({
          node,
          messageId: 'uppercase',
          data: { url },
          fix(fixer) {
            const fixedAttrText = fixUppercaseInUrl(context, attrNode, url)
            return fixer.replaceText(attrNode, fixedAttrText)
          },
        })
      }
    }

    // For Vue SFC files
    if (isVueParser(context as any)) {
      const templateVisitor = {
        VElement(node: any) {
          // Check anchor tags and router links
          if (node.name === 'a' || node.name === 'nuxtlink' || node.name === 'routerlink') {
            checkLinkUrl(node)
          }
        },
      }

      return defineTemplateBodyVisitor(context, templateVisitor, {})
    }

    // For JSX files
    return {
      JSXElement(node: any) {
        const elementName = node.openingElement?.name?.name
        if (elementName === 'a' || elementName === 'NuxtLink' || elementName === 'RouterLink') {
          // Check JSX attributes for href/to
          for (const attr of node.openingElement.attributes || []) {
            if (attr.type === 'JSXAttribute' && (attr.name?.name === 'href' || attr.name?.name === 'to')) {
              if (attr.value?.type === 'Literal' && typeof attr.value.value === 'string') {
                const url = attr.value.value
                const hasUppercase = /[A-Z]/.test(url)
                const isUrlEncoded = /%[0-9A-F]{2}/i.test(url)
                
                if (hasUppercase && !isUrlEncoded) {
                  context.report({
                    node,
                    messageId: 'uppercase',
                    data: { url },
                    fix(fixer) {
                      const lowercaseUrl = url.toLowerCase()
                      return fixer.replaceText(attr.value, `"${lowercaseUrl}"`)
                    },
                  })
                }
              }
            }
          }
        }
      },
    }
  },
})
