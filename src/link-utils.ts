export interface LinkRuleOptions {
  ignoreExternal?: boolean
  exclude?: string[]
}

export const linkRuleSchema = {
  type: 'object' as const,
  properties: {
    ignoreExternal: {
      type: 'boolean' as const,
      default: false,
    },
    exclude: {
      type: 'array' as const,
      items: { type: 'string' as const },
      default: [],
    },
  },
  additionalProperties: false,
}

export const linkRuleDefaults: LinkRuleOptions = { ignoreExternal: false, exclude: [] }

export function getLinkUrl(node: any): { url: string | null, attrNode: any | null } {
  if (!node.startTag?.attributes)
    return { url: null, attrNode: null }

  for (const attr of node.startTag.attributes) {
    if (attr.key?.name === 'href' || attr.key?.name === 'to') {
      if (attr.value?.type === 'VLiteral')
        return { url: attr.value.value, attrNode: attr }
    }
  }

  return { url: null, attrNode: null }
}

export function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

export function hasExternalAttr(node: any): boolean {
  if (!node.startTag?.attributes)
    return false
  return node.startTag.attributes.some((attr: any) =>
    attr.key?.name === 'external'
    || (attr.key?.argument?.name === 'external' && attr.key?.name?.name === 'bind'),
  )
}

export function hasJsxExternalAttr(attrs: any[]): boolean {
  return attrs.some((a: any) =>
    a.type === 'JSXAttribute' && a.name?.name === 'external',
  )
}

const excludeCache = new Map<string, RegExp>()

function getExcludeRegex(pattern: string): RegExp {
  let regex = excludeCache.get(pattern)
  if (!regex) {
    regex = new RegExp(pattern)
    excludeCache.set(pattern, regex)
  }
  return regex
}

export function shouldSkipLink(url: string, node: any, options: LinkRuleOptions): boolean {
  if (options.ignoreExternal && (isExternalUrl(url) || hasExternalAttr(node)))
    return true
  if (options.exclude?.length) {
    for (const pattern of options.exclude) {
      if (getExcludeRegex(pattern).test(url))
        return true
    }
  }
  return false
}

export function shouldSkipJsxLink(url: string, attrs: any[], options: LinkRuleOptions): boolean {
  if (options.ignoreExternal && (isExternalUrl(url) || hasJsxExternalAttr(attrs)))
    return true
  if (options.exclude?.length) {
    for (const pattern of options.exclude) {
      if (getExcludeRegex(pattern).test(url))
        return true
    }
  }
  return false
}
