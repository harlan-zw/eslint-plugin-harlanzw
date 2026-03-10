import type { LinkRuleOptions } from '../link-utils'
import { getLinkUrl, linkRuleDefaults, linkRuleSchema, shouldSkipJsxLink, shouldSkipLink } from '../link-utils'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

const REGEX_2 = /[^\u0020-\u007F]/
const REGEX_1 = /[^\u0020-\u007F]/

export const RULE_NAME = 'link-ascii-only'
export type MessageIds = 'nonAscii'
export type Options = [LinkRuleOptions]

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensures link URLs contain only ASCII characters',
    },
    fixable: 'code',
    schema: [linkRuleSchema],
    messages: {
      nonAscii: 'Link URL "{{url}}" should not contain non-ASCII characters.',
    },
  },
  defaultOptions: [linkRuleDefaults],
  create(context, options) {
    const opts = options[0] || {}

    function checkLinkUrl(node: any) {
      const { url, attrNode } = getLinkUrl(node)
      if (!url || !attrNode)
        return
      if (shouldSkipLink(url, node, opts))
        return

      if (REGEX_2.test(url)) {
        const sourceCode = context.sourceCode
        const attrText = sourceCode.getText(attrNode)
        context.report({
          node,
          messageId: 'nonAscii',
          data: { url },
          fix(fixer) {
            return fixer.replaceText(attrNode, attrText.replace(url, encodeURI(url)))
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
                if (shouldSkipJsxLink(url, attrs, opts))
                  continue
                if (REGEX_1.test(url)) {
                  context.report({
                    node,
                    messageId: 'nonAscii',
                    data: { url },
                    fix(fixer) {
                      return fixer.replaceText(attr.value, `"${encodeURI(url)}"`)
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
