import { dirname, posix, relative, sep } from 'node:path'
import { createEslintRule } from '../utils'

export const RULE_NAME = 'nuxt-no-self-layer-alias'
export type MessageIds = 'preferRelative'
export type Options = []

const LAYER_ALIAS_RE = /^#layers\/([^/]+)\/(.+)$/
const FILE_LAYER_RE = /(?:^|[\\/])layers[\\/]([^\\/]+)[\\/]/

function toPosix(p: string): string {
  return sep === '\\' ? p.split(sep).join('/') : p
}

function computeRelative(fromFile: string, toFile: string): string {
  const fromDir = toPosix(dirname(fromFile))
  const toPath = toPosix(toFile)
  let rel = posix.relative(fromDir, toPath)
  if (!rel.startsWith('.'))
    rel = `./${rel}`
  return rel
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'disallow importing from the same Nuxt layer via #layers/<name> alias; prefer a relative path',
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferRelative: 'Prefer relative path \'{{replacement}}\' over self-layer alias \'{{original}}\'',
    },
  },
  defaultOptions: [],
  create: (context) => {
    const filename = toPosix(context.filename ?? (context as any).getFilename?.() ?? '')
    const fileMatch = filename.match(FILE_LAYER_RE)
    if (!fileMatch)
      return {}
    const fileLayer = fileMatch[1]

    function check(valueNode: any) {
      if (!valueNode || valueNode.type !== 'Literal' || typeof valueNode.value !== 'string')
        return
      const original = valueNode.value
      const m = original.match(LAYER_ALIAS_RE)
      if (!m)
        return
      const [, layer, rest] = m
      if (layer !== fileLayer)
        return
      const target = `layers/${layer}/${rest}`
      const fileIdx = filename.indexOf(`/layers/${layer}/`)
      const root = fileIdx >= 0 ? filename.slice(0, fileIdx + 1) : ''
      const replacement = computeRelative(filename, `${root}${target}`)
      context.report({
        node: valueNode,
        messageId: 'preferRelative',
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
        check(node.source)
      },
      ExportNamedDeclaration(node) {
        if (node.source)
          check(node.source)
      },
      ExportAllDeclaration(node) {
        if (node.source)
          check(node.source)
      },
      ImportExpression(node) {
        check(node.source)
      },
    }
  },
})
