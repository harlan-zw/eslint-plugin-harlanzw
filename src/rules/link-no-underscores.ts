import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'link-no-underscores'
export type MessageIds = 'underscores'
export type Options = []

function getLinkUrl(node: any): { url: string | null, attrNode: any | null } {
  if (!node.startTag?.attributes) {
    return { url: null, attrNode: null }
  }

  for (const attr of node.startTag.attributes) {
    if (attr.key?.name === 'href' || attr.key?.name === 'to') {
      if (attr.value?.type === 'VLiteral') {
        return { url: attr.value.value, attrNode: attr }
      }
    }
  }

  return { url: null, attrNode: null }
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensures link URLs do not contain underscores',
    },
    fixable: 'code',
    schema: [],
    messages: {
      underscores: 'Link URL "{{url}}" should not contain underscores.',
    },
  },
  defaultOptions: [],
  create(context) {
    function checkLinkUrl(node: any) {
      const { url, attrNode } = getLinkUrl(node)

      if (!url || !attrNode) {
        return
      }

      // Skip external URLs
      if (/^(?:https?:)?\/\//.test(url)) {
        return
      }

      if (url.includes('_')) {
        const sourceCode = context.sourceCode
        const attrText = sourceCode.getText(attrNode)
        const fixedUrl = url.replaceAll('_', '-')
        const fixedAttrText = attrText.replace(url, fixedUrl)

        context.report({
          node,
          messageId: 'underscores',
          data: { url },
          fix(fixer) {
            return fixer.replaceText(attrNode, fixedAttrText)
          },
        })
      }
    }

    if (isVueParser(context as any)) {
      return defineTemplateBodyVisitor(context, {
        VElement(node: any) {
          if (node.name === 'a' || node.name === 'nuxtlink' || node.name === 'routerlink') {
            checkLinkUrl(node)
          }
        },
      }, {})
    }

    return {
      JSXElement(node: any) {
        const elementName = node.openingElement?.name?.name
        if (elementName === 'a' || elementName === 'NuxtLink' || elementName === 'RouterLink') {
          for (const attr of node.openingElement.attributes || []) {
            if (attr.type === 'JSXAttribute' && (attr.name?.name === 'href' || attr.name?.name === 'to')) {
              if (attr.value?.type === 'Literal' && typeof attr.value.value === 'string') {
                const url = attr.value.value
                if (/^(?:https?:)?\/\//.test(url)) {
                  continue
                }
                if (url.includes('_')) {
                  const fixedUrl = url.replaceAll('_', '-')
                  context.report({
                    node,
                    messageId: 'underscores',
                    data: { url },
                    fix(fixer) {
                      return fixer.replaceText(attr.value, `"${fixedUrl}"`)
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
