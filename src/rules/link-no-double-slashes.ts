import type { LinkRuleOptions } from '../link-utils'
import { getLinkUrl, linkRuleDefaults, linkRuleSchema, shouldSkipJsxLink, shouldSkipLink } from '../link-utils'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'link-no-double-slashes'
export type MessageIds = 'doubleSlashes'
export type Options = [LinkRuleOptions]

function fixDoubleSlashesInUrl(url: string): string {
  if (url.startsWith('//') || url.includes('://'))
    return url

  let path = url
  let search = ''
  let hash = ''

  const hashIndex = url.indexOf('#')
  if (hashIndex !== -1) {
    hash = url.slice(hashIndex)
    path = url.slice(0, hashIndex)
  }

  const searchIndex = path.indexOf('?')
  if (searchIndex !== -1) {
    search = path.slice(searchIndex)
    path = path.slice(0, searchIndex)
  }

  return `${path.replace(/\/+/g, '/')}${search}${hash}`
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensures link URLs do not contain consecutive slashes in the path',
    },
    fixable: 'code',
    schema: [linkRuleSchema],
    messages: {
      doubleSlashes: 'Link URL "{{url}}" should not contain consecutive slashes.',
    },
  },
  defaultOptions: [{ ...linkRuleDefaults, ignoreExternal: true }],
  create(context, options) {
    const opts = options[0] || {}

    function checkLinkUrl(node: any) {
      const { url, attrNode } = getLinkUrl(node)
      if (!url || !attrNode)
        return
      // Skip protocol-relative URLs and full URLs
      if (url.startsWith('//') || url.includes('://'))
        return
      if (shouldSkipLink(url, node, opts))
        return

      if (/\/{2,}/.test(url)) {
        const sourceCode = context.sourceCode
        const attrText = sourceCode.getText(attrNode)
        context.report({
          node,
          messageId: 'doubleSlashes',
          data: { url },
          fix(fixer) {
            return fixer.replaceText(attrNode, attrText.replace(url, fixDoubleSlashesInUrl(url)))
          },
        })
      }
    }

    if (isVueParser(context as any)) {
      return defineTemplateBodyVisitor(context, {
        VElement(node: any) {
          if (node.name === 'a' || node.name === 'nuxtlink' || node.name === 'routerlink')
            checkLinkUrl(node)
        },
      }, {})
    }

    return {
      JSXElement(node: any) {
        const elementName = node.openingElement?.name?.name
        if (elementName === 'a' || elementName === 'NuxtLink' || elementName === 'RouterLink') {
          const attrs = node.openingElement.attributes || []
          for (const attr of attrs) {
            if (attr.type === 'JSXAttribute' && (attr.name?.name === 'href' || attr.name?.name === 'to')) {
              if (attr.value?.type === 'Literal' && typeof attr.value.value === 'string') {
                const url = attr.value.value
                if (url.startsWith('//') || url.includes('://'))
                  return
                if (shouldSkipJsxLink(url, attrs, opts))
                  continue
                if (/\/{2,}/.test(url)) {
                  context.report({
                    node,
                    messageId: 'doubleSlashes',
                    data: { url },
                    fix(fixer) {
                      return fixer.replaceText(attr.value, `"${fixDoubleSlashesInUrl(url)}"`)
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
