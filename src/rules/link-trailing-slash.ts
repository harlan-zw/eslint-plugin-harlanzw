import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'link-trailing-slash'
export type MessageIds = 'addTrailingSlash' | 'removeTrailingSlash'
export type Options = [{ requireTrailingSlash?: boolean }]

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

function shouldSkip(url: string): boolean {
  return url.startsWith('http') || url.startsWith('#')
    || url.includes(':') || url === '/' || url === ''
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforces consistent use of trailing slashes in URLs',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          requireTrailingSlash: {
            type: 'boolean',
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      addTrailingSlash: 'URL "{{url}}" should end with a trailing slash.',
      removeTrailingSlash: 'URL "{{url}}" should not end with a trailing slash.',
    },
  },
  defaultOptions: [{ requireTrailingSlash: false }],
  create(context, options) {
    const { requireTrailingSlash = false } = options[0] || {}

    function checkLinkUrl(node: any) {
      const { url, attrNode } = getLinkUrl(node)

      if (!url || !attrNode || shouldSkip(url)) {
        return
      }

      const hasTrailingSlash = url.endsWith('/')
      const sourceCode = context.sourceCode
      const attrText = sourceCode.getText(attrNode)

      if (requireTrailingSlash && !hasTrailingSlash) {
        context.report({
          node,
          messageId: 'addTrailingSlash',
          data: { url },
          fix(fixer) {
            return fixer.replaceText(attrNode, attrText.replace(url, `${url}/`))
          },
        })
      }
      else if (!requireTrailingSlash && hasTrailingSlash) {
        context.report({
          node,
          messageId: 'removeTrailingSlash',
          data: { url },
          fix(fixer) {
            return fixer.replaceText(attrNode, attrText.replace(url, url.slice(0, -1)))
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
                if (shouldSkip(url)) {
                  continue
                }
                const hasTrailingSlash = url.endsWith('/')
                if (requireTrailingSlash && !hasTrailingSlash) {
                  context.report({
                    node,
                    messageId: 'addTrailingSlash',
                    data: { url },
                    fix(fixer) {
                      return fixer.replaceText(attr.value, `"${url}/"`)
                    },
                  })
                }
                else if (!requireTrailingSlash && hasTrailingSlash) {
                  context.report({
                    node,
                    messageId: 'removeTrailingSlash',
                    data: { url },
                    fix(fixer) {
                      return fixer.replaceText(attr.value, `"${url.slice(0, -1)}"`)
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
