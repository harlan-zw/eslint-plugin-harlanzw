import type { LinkRuleOptions } from '../link-utils'
import { getLinkUrl, linkRuleDefaults, linkRuleSchema, shouldSkipJsxLink, shouldSkipLink } from '../link-utils'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

const REGEX_4 = /[A-Z]/
const REGEX_3 = /%[0-9A-F]{2}/i
const REGEX_2 = /[A-Z]/
const REGEX_1 = /%[0-9A-F]{2}/i

export const RULE_NAME = 'link-lowercase'
export type MessageIds = 'uppercase'
export type Options = [LinkRuleOptions]

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensures link URLs do not contain uppercase characters',
    },
    fixable: 'code',
    schema: [linkRuleSchema],
    messages: {
      uppercase: 'Link URL "{{url}}" should not contain uppercase characters.',
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

      // Check for uppercase characters, but ignore URL-encoded sequences (%XX)
      const hasUppercase = REGEX_4.test(url)
      const isUrlEncoded = REGEX_3.test(url)

      if (hasUppercase && !isUrlEncoded) {
        const sourceCode = context.sourceCode
        const attrText = sourceCode.getText(attrNode)
        context.report({
          node,
          messageId: 'uppercase',
          data: { url },
          fix(fixer) {
            return fixer.replaceText(attrNode, attrText.replace(url, url.toLowerCase()))
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

                const hasUppercase = REGEX_2.test(url)
                const isUrlEncoded = REGEX_1.test(url)

                if (hasUppercase && !isUrlEncoded) {
                  context.report({
                    node,
                    messageId: 'uppercase',
                    data: { url },
                    fix(fixer) {
                      return fixer.replaceText(attr.value, `"${url.toLowerCase()}"`)
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
