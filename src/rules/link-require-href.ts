import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'link-require-href'
export type MessageIds = 'missingHref'
export type Options = []

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensures anchor tags have an href or to attribute',
    },
    schema: [],
    messages: {
      missingHref: 'Anchor tags require an href or to attribute for accessibility.',
    },
  },
  defaultOptions: [],
  create(context) {
    if (isVueParser(context as any)) {
      return defineTemplateBodyVisitor(context, {
        VElement(node: any) {
          if (node.name !== 'a' && node.name !== 'nuxtlink' && node.name !== 'routerlink') {
            return
          }

          if (!node.startTag?.attributes) {
            return
          }

          for (const attr of node.startTag.attributes) {
            // Static href/to
            if (attr.key?.name === 'href' || attr.key?.name === 'to') {
              return
            }
            // Dynamic :href/:to (v-bind)
            if (attr.key?.type === 'VDirectiveKey'
              && attr.key?.name?.name === 'bind'
              && (attr.key?.argument?.name === 'href' || attr.key?.argument?.name === 'to')) {
              return
            }
            // role="button"
            if (attr.key?.name === 'role' && attr.value?.value === 'button') {
              return
            }
          }

          context.report({
            node,
            messageId: 'missingHref',
          })
        },
      }, {})
    }

    return {
      JSXElement(node: any) {
        const elementName = node.openingElement?.name?.name
        if (elementName !== 'a' && elementName !== 'NuxtLink' && elementName !== 'RouterLink') {
          return
        }

        for (const attr of node.openingElement.attributes || []) {
          if (attr.type === 'JSXAttribute') {
            if (attr.name?.name === 'href' || attr.name?.name === 'to') {
              return
            }
            if (attr.name?.name === 'role' && attr.value?.type === 'Literal' && attr.value.value === 'button') {
              return
            }
          }
        }

        context.report({
          node,
          messageId: 'missingHref',
        })
      },
    }
  },
})
