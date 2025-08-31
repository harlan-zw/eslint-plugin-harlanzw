import { createEslintRule } from '../utils'
import { defineTemplateBodyVisitor, isVueParser } from '../vue-utils'

export const RULE_NAME = 'link-no-double-slashes'
export type MessageIds = 'doubleSlashes'
export type Options = []

function getLinkUrl(node: any): { url: string | null, attrNode: any | null } {
  if (!node.startTag?.attributes) {
    return { url: null, attrNode: null }
  }
  
  // Check for href or to attributes
  for (const attr of node.startTag.attributes) {
    if (attr.key?.name === 'href' || attr.key?.name === 'to') {
      if (attr.value?.type === 'VLiteral') {
        return { url: attr.value.value, attrNode: attr }
      }
    }
  }
  
  return { url: null, attrNode: null }
}

function fixDoubleSlashesInUrl(url: string): string {
  // Skip protocol-relative URLs (//example.com) and full URLs
  if (url.startsWith('//') || url.includes('://')) {
    return url
  }
  
  // Parse the URL to separate path, search, and hash
  let path = url
  let search = ''
  let hash = ''
  
  const hashIndex = url.indexOf('#')
  if (hashIndex !== -1) {
    hash = url.slice(hashIndex)
    path = url.slice(0, hashIndex)
  }
  
  const searchIndex = path.indexOf('?')
  if (searchIndex !== -1) {
    search = path.slice(searchIndex)
    path = path.slice(0, searchIndex)
  }
  
  // Fix consecutive slashes in the path only
  const fixedPath = path.replace(/\/+/g, '/')
  
  return `${fixedPath}${search}${hash}`
}

function fixDoubleSlashesInAttr(context: any, attrNode: any, url: string) {
  const fixedUrl = fixDoubleSlashesInUrl(url)
  const sourceCode = context.getSourceCode()
  const attrText = sourceCode.getText(attrNode)
  
  // Replace the URL value while preserving quotes
  const fixedAttrText = attrText.replace(url, fixedUrl)
  return fixedAttrText
}

export default createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensures link URLs do not contain consecutive slashes in the path',
    },
    fixable: 'code',
    schema: [],
    messages: {
      doubleSlashes: 'Link URL "{{url}}" should not contain consecutive slashes.',
    },
  },
  defaultOptions: [],
  create(context) {
    function checkLinkUrl(node: any) {
      const { url, attrNode } = getLinkUrl(node)
      
      if (!url || !attrNode) {
        return
      }
      
      // Skip protocol-relative URLs and full URLs
      if (url.startsWith('//') || url.includes('://')) {
        return
      }
      
      // Check for consecutive slashes (but not at the start for protocol-relative)
      if (/\/\/+/.test(url)) {
        context.report({
          node,
          messageId: 'doubleSlashes',
          data: { url },
          fix(fixer) {
            const fixedAttrText = fixDoubleSlashesInAttr(context, attrNode, url)
            return fixer.replaceText(attrNode, fixedAttrText)
          },
        })
      }
    }

    // For Vue SFC files
    if (isVueParser(context as any)) {
      const templateVisitor = {
        VElement(node: any) {
          // Check anchor tags and router links
          if (node.name === 'a' || node.name === 'nuxtlink' || node.name === 'routerlink') {
            checkLinkUrl(node)
          }
        },
      }

      return defineTemplateBodyVisitor(context, templateVisitor, {})
    }

    // For JSX files
    return {
      JSXElement(node: any) {
        const elementName = node.openingElement?.name?.name
        if (elementName === 'a' || elementName === 'NuxtLink' || elementName === 'RouterLink') {
          // Check JSX attributes for href/to
          for (const attr of node.openingElement.attributes || []) {
            if (attr.type === 'JSXAttribute' && (attr.name?.name === 'href' || attr.name?.name === 'to')) {
              if (attr.value?.type === 'Literal' && typeof attr.value.value === 'string') {
                const url = attr.value.value
                
                // Skip protocol-relative URLs and full URLs
                if (url.startsWith('//') || url.includes('://')) {
                  return
                }
                
                if (/\/\/+/.test(url)) {
                  context.report({
                    node,
                    messageId: 'doubleSlashes',
                    data: { url },
                    fix(fixer) {
                      const fixedUrl = fixDoubleSlashesInUrl(url)
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