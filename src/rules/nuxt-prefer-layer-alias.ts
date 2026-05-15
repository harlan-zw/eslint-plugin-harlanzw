import { createEslintRule } from '../utils'

export const RULE_NAME = 'nuxt-prefer-layer-alias'
export type MessageIds = 'preferLayerAlias'
export type Options = []

const LAYER_PATH_RE = /^(?:~~|@@|~|@)\/layers\/([^/]+)\/(.+)$/

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'prefer Nuxt #layers/<name> alias over ~~/layers/<name> paths',
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferLayerAlias: 'Prefer Nuxt layer alias \'{{replacement}}\' over \'{{original}}\'',
    },
  },
  defaultOptions: [],
  create: (context) => {
    function check(node: any, valueNode: any) {
      if (!valueNode || valueNode.type !== 'Literal' || typeof valueNode.value !== 'string')
        return
      const original = valueNode.value
      const match = original.match(LAYER_PATH_RE)
      if (!match)
        return
      const [, layer, rest] = match
      const replacement = `#layers/${layer}/${rest}`
      context.report({
        node: valueNode,
        messageId: 'preferLayerAlias',
        data: { original, replacement },
        fix(fixer) {
          const raw = (valueNode.raw as string) ?? `'${original}'`
          const quote = raw[0] === '"' ? '"' : '\''
          return fixer.replaceText(valueNode, `${quote}${replacement}${quote}`)
        },
      })
    }

    return {
      ImportDeclaration(node) {
        check(node, node.source)
      },
      ExportNamedDeclaration(node) {
        if (node.source)
          check(node, node.source)
      },
      ExportAllDeclaration(node) {
        if (node.source)
          check(node, node.source)
      },
      ImportExpression(node) {
        check(node, node.source)
      },
    }
  },
})
