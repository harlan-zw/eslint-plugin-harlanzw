import type { LinkRuleOptions } from '../link-utils'
import { linkRuleDefaults, linkRuleSchema, shouldSkipJsxLink, shouldSkipLink } from '../link-utils'
import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'link-require-descriptive-text'
export type MessageIds = 'nonDescriptive'
export type Options = [LinkRuleOptions]

const BAD_LINK_TEXTS = new Set([
  'click here',
  'click this',
  'go',
  'here',
  'this',
  'start',
  'right here',
  'more',
  'learn more',
  'read more',
  'continue',
  'link',
  'view',
  'details',
  'read',
  'discover',
])

function getVueElementText(node: any): string | null {
  const children = node.children || []
  // Trust dynamic content: child components, expression containers, slots
  if (children.some((child: any) => child.type === 'VElement' || child.type === 'VExpressionContainer'))
    return '[dynamic]'
  return children
    .filter((child: any) => child.type === 'VText')
    .map((child: any) => child.value)
    .join('')
    .trim() || null
}

function getVueAttrValue(node: any, name: string): string | null {
  if (!node.startTag?.attributes)
    return null
  for (const attr of node.startTag.attributes) {
    // Static attribute: aria-label="text"
    if (attr.key?.name === name && attr.value?.type === 'VLiteral')
      return attr.value.value
    // v-bind directive: :aria-label="expr" — trust it has a value
    if (attr.directive && attr.key?.name?.name === 'bind' && attr.key?.argument?.name === name)
      return '[dynamic]'
  }
  return null
}

function getVueLinkUrl(node: any): string | null {
  if (!node.startTag?.attributes)
    return null
  for (const attr of node.startTag.attributes) {
    if ((attr.key?.name === 'href' || attr.key?.name === 'to') && attr.value?.type === 'VLiteral')
      return attr.value.value
  }
  return null
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensures links have descriptive text content',
    },
    schema: [linkRuleSchema],
    messages: {
      nonDescriptive: 'Link text "{{textContent}}" should be more descriptive.',
    },
  },
  defaultOptions: [linkRuleDefaults],
  create(context, options) {
    const opts = options[0] || {}

    function checkText(text: string | null, node: any) {
      if (!text) {
        context.report({
          node,
          messageId: 'nonDescriptive',
          data: { textContent: 'Missing link text, title, or aria-label.' },
        })
        return
      }
      if (BAD_LINK_TEXTS.has(text.trim().toLowerCase())) {
        context.report({
          node,
          messageId: 'nonDescriptive',
          data: { textContent: text },
        })
      }
    }

    if (isVueParser(context as any)) {
      return defineTemplateBodyVisitor(context, {
        VElement(node: any) {
          if (node.name === 'a' || node.name === 'nuxtlink' || node.name === 'routerlink') {
            const url = getVueLinkUrl(node)
            if (url && shouldSkipLink(url, node, opts))
              return
            const text = getVueElementText(node)
              || getVueAttrValue(node, 'title')
              || getVueAttrValue(node, 'aria-label')
            checkText(text, node)
          }
        },
      }, {})
    }

    return {
      JSXElement(node: any) {
        const elementName = node.openingElement?.name?.name
        if (elementName === 'a' || elementName === 'NuxtLink' || elementName === 'RouterLink') {
          const attrs = node.openingElement.attributes || []

          // Get URL for exclude check
          let url: string | null = null
          for (const attr of attrs) {
            if (attr.type === 'JSXAttribute' && (attr.name?.name === 'href' || attr.name?.name === 'to')) {
              if (attr.value?.type === 'Literal' && typeof attr.value.value === 'string')
                url = attr.value.value
            }
          }
          if (url && shouldSkipJsxLink(url, attrs, opts))
            return

          const textContent = (node.children || [])
            .filter((child: any) => child.type === 'JSXText')
            .map((child: any) => child.value)
            .join('')
            .trim()

          let title: string | null = null
          let ariaLabel: string | null = null
          for (const attr of attrs) {
            if (attr.type === 'JSXAttribute') {
              if (attr.name?.name === 'title' && attr.value?.type === 'Literal')
                title = attr.value.value
              if (attr.name?.name === 'aria-label' && attr.value?.type === 'Literal')
                ariaLabel = attr.value.value
            }
          }

          checkText(textContent || title || ariaLabel, node)
        }
      },
    }
  },
})
