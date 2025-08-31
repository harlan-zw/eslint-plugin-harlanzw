import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'link-no-whitespace'
export type MessageIds = 'noWhitespace'
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

function fixWhitespaceInUrl(context: any, attrNode: any, url: string) {
  const encodedUrl = url.replace(/\s/g, match => encodeURIComponent(match))
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
      description: 'Ensures link URLs do not contain whitespace characters',
    },
    fixable: 'code',
    schema: [],
    messages: {
      noWhitespace: 'Link URL "{{url}}" should not contain whitespace characters.',
    },
  },
  defaultOptions: [],
  create(context) {
    function checkLinkUrl(node: any) {
      const { url, attrNode } = getLinkUrl(node)

      if (!url || !attrNode) {
        return
      }

      // Check for whitespace in the URL
      if (/\s/.test(url)) {
        context.report({
          node,
          messageId: 'noWhitespace',
          data: { url },
          fix(fixer) {
            const fixedAttrText = fixWhitespaceInUrl(context, attrNode, url)
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
                if (/\s/.test(url)) {
                  context.report({
                    node,
                    messageId: 'noWhitespace',
                    data: { url },
                    fix(fixer) {
                      const encodedUrl = url.replace(/\s/g, match => encodeURIComponent(match))
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
