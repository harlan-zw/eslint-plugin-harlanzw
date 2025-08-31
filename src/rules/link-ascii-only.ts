import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'link-ascii-only'
export type MessageIds = 'nonAscii'
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

function fixNonAsciiInUrl(context: any, attrNode: any, url: string) {
  const encodedUrl = encodeURI(url)
  const sourceCode = context.getSourceCode()
  const attrText = sourceCode.getText(attrNode)

  // Replace the URL value while preserving quotes
  const fixedAttrText = attrText.replace(url, encodedUrl)
  return fixedAttrText
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensures link URLs contain only ASCII characters',
    },
    fixable: 'code',
    schema: [],
    messages: {
      nonAscii: 'Link URL "{{url}}" should not contain non-ASCII characters.',
    },
  },
  defaultOptions: [],
  create(context) {
    function checkLinkUrl(node: any) {
      const { url, attrNode } = getLinkUrl(node)

      if (!url || !attrNode) {
        return
      }

      // Check for non-ASCII characters (outside U+0020-U+007F range)
      if (/[^\u0020-\u007F]/.test(url)) {
        context.report({
          node,
          messageId: 'nonAscii',
          data: { url },
          fix(fixer) {
            const fixedAttrText = fixNonAsciiInUrl(context, attrNode, url)
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
                if (/[^\u0020-\u007F]/.test(url)) {
                  context.report({
                    node,
                    messageId: 'nonAscii',
                    data: { url },
                    fix(fixer) {
                      const encodedUrl = encodeURI(url)
                      return fixer.replaceText(attr.value, `"${encodedUrl}"`)
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
