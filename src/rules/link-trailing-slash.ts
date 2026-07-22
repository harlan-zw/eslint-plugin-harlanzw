import type { LinkRuleOptions } from '../link-utils'
import { getLinkUrl, linkRuleDefaults, shouldSkipJsxLink, shouldSkipLink } from '../link-utils'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'link-trailing-slash'
export type MessageIds = 'addTrailingSlash' | 'removeTrailingSlash'
export type Options = [LinkRuleOptions & { requireTrailingSlash?: boolean }]

function splitUrl(url: string): { path: string, suffix: string } {
  const queryIndex = url.indexOf('?')
  const hashIndex = url.indexOf('#')
  const suffixIndex = queryIndex === -1
    ? hashIndex
    : hashIndex === -1
      ? queryIndex
      : Math.min(queryIndex, hashIndex)

  return suffixIndex === -1
    ? { path: url, suffix: '' }
    : { path: url.slice(0, suffixIndex), suffix: url.slice(suffixIndex) }
}

function shouldSkipUrl(url: string): boolean {
  const { path } = splitUrl(url)
  return url.startsWith('#') || url.includes(':') || path === '/' || path === ''
}

function fixTrailingSlash(url: string, requireTrailingSlash: boolean): string {
  const { path, suffix } = splitUrl(url)
  if (requireTrailingSlash && !path.endsWith('/'))
    return `${path}/${suffix}`
  if (!requireTrailingSlash && path.endsWith('/'))
    return `${path.slice(0, -1)}${suffix}`
  return url
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
          ignoreExternal: {
            type: 'boolean',
            default: true,
          },
          exclude: {
            type: 'array',
            items: { type: 'string' },
            default: [],
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
  defaultOptions: [{ ...linkRuleDefaults, ignoreExternal: true, requireTrailingSlash: false }],
  create(context, options) {
    const { requireTrailingSlash = false, ...opts } = options[0] || {}

    function checkLinkUrl(node: any) {
      const { url, attrNode } = getLinkUrl(node)
      if (!url || !attrNode || shouldSkipUrl(url))
        return
      if (shouldSkipLink(url, node, opts))
        return

      const fixedUrl = fixTrailingSlash(url, requireTrailingSlash)
      if (fixedUrl === url)
        return

      const sourceCode = context.sourceCode
      const attrText = sourceCode.getText(attrNode)

      if (requireTrailingSlash) {
        context.report({
          node,
          messageId: 'addTrailingSlash',
          data: { url },
          fix(fixer) {
            return fixer.replaceText(attrNode, attrText.replace(url, fixedUrl))
          },
        })
      }
      else {
        context.report({
          node,
          messageId: 'removeTrailingSlash',
          data: { url },
          fix(fixer) {
            return fixer.replaceText(attrNode, attrText.replace(url, fixedUrl))
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
                if (shouldSkipUrl(url))
                  continue
                if (shouldSkipJsxLink(url, attrs, opts))
                  continue
                const fixedUrl = fixTrailingSlash(url, requireTrailingSlash)
                if (fixedUrl === url)
                  continue

                if (requireTrailingSlash) {
                  context.report({
                    node,
                    messageId: 'addTrailingSlash',
                    data: { url },
                    fix(fixer) {
                      return fixer.replaceText(attr.value, `"${fixedUrl}"`)
                    },
                  })
                }
                else {
                  context.report({
                    node,
                    messageId: 'removeTrailingSlash',
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
