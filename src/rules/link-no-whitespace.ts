import type { LinkRuleOptions } from '../link-utils'
import { getLinkUrl, linkRuleDefaults, linkRuleSchema, shouldSkipJsxLink, shouldSkipLink } from '../link-utils'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

const REGEX_4 = /\s/
const REGEX_3 = /\s/g
const REGEX_2 = /\s/
const REGEX_1 = /\s/g

export const RULE_NAME = 'link-no-whitespace'
export type MessageIds = 'noWhitespace'
export type Options = [LinkRuleOptions]

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensures link URLs do not contain whitespace characters',
    },
    fixable: 'code',
    schema: [linkRuleSchema],
    messages: {
      noWhitespace: 'Link URL "{{url}}" should not contain whitespace characters.',
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

      if (REGEX_4.test(url)) {
        const sourceCode = context.sourceCode
        const attrText = sourceCode.getText(attrNode)
        context.report({
          node,
          messageId: 'noWhitespace',
          data: { url },
          fix(fixer) {
            const encodedUrl = url.replace(REGEX_3, (m: string) => encodeURIComponent(m))
            return fixer.replaceText(attrNode, attrText.replace(url, encodedUrl))
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
                if (REGEX_2.test(url)) {
                  context.report({
                    node,
                    messageId: 'noWhitespace',
                    data: { url },
                    fix(fixer) {
                      const encodedUrl = url.replace(REGEX_1, (m: string) => encodeURIComponent(m))
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
