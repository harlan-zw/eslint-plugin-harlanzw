import type { LinkRuleOptions } from '../link-utils'
import { getLinkUrl, linkRuleDefaults, linkRuleSchema, shouldSkipJsxLink, shouldSkipLink } from '../link-utils'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'link-no-underscores'
export type MessageIds = 'underscores'
export type Options = [LinkRuleOptions]

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensures link URLs do not contain underscores',
    },
    fixable: 'code',
    schema: [linkRuleSchema],
    messages: {
      underscores: 'Link URL "{{url}}" should not contain underscores.',
    },
  },
  defaultOptions: [{ ...linkRuleDefaults, ignoreExternal: true }],
  create(context, options) {
    const opts = options[0] || {}

    function checkLinkUrl(node: any) {
      const { url, attrNode } = getLinkUrl(node)
      if (!url || !attrNode)
        return
      if (shouldSkipLink(url, node, opts))
        return

      if (url.includes('_')) {
        const sourceCode = context.sourceCode
        const attrText = sourceCode.getText(attrNode)
        const fixedUrl = url.replaceAll('_', '-')
        context.report({
          node,
          messageId: 'underscores',
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
                if (shouldSkipJsxLink(url, attrs, opts))
                  continue
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
